import { parsePemCertificate, convertX509NameToString, tbsCertstoBytes, getSubjectPublicKeyInfoDER } from "../js_lib/x509utils.js"
import {sha256Hash_arrayBuffer_1, sha256Hash_3 } from "./helper.js"

var startTime, endTime;
var accTime = 0;

function meas_start() {
  startTime = performance.now();
};

function meas_end() {
    endTime = performance.now();
    var timeDiff = endTime - startTime; //in ms 
    // accTime += timeDiff;
    console.log("measure result: ", timeDiff)
}

export function buf2hex(byteArray) { // buffer is an ArrayBuffer
    return Array.from(byteArray, function(byte) {
        return ('0' + (byte & 0xFF).toString(16)).slice(-2);
      }).join('')
}



function bytesArrayXor(a, b) {
    if (a.length != b.length) {
        console.error("Length not equal", a.length, b.length);
    }
    var c = new Uint8Array(a.length);
    for(let i = 0; i < a.length; i++)
    {
        c[i] = a[i] ^ b[i];
    }
    return c;
}

function isByteArrayEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) {
        return false;
      }
    
      for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) {
          return false;
        }
      }
    
      return true;
}

function hexToByteArray(hexstring) {
    let bytes = [];
    for (var c = 0; c < hexstring.length; c += 2)
    {
        bytes.push(parseInt(hexstring.substr(c, 2), 16));
    }
    return bytes;
}


async function resolveResponseSig(cert, rlast, hlast, loc) {
    var ts = new Uint8Array(4);

    let encoder = new TextEncoder();
    let issuer_bytes = encoder.encode(convertX509NameToString(cert.tbsCertificate.issuer));
    let cert_bytes = tbsCertstoBytes(cert);

    var raw = new Uint8Array([
        ...ts,
        ...cert_bytes,
        ...issuer_bytes,
    ])

    var hc = await sha256Hash_arrayBuffer_1(raw);

    var hmask;
    if (loc === 0) {
        hmask = hc;
    } else {
        hmask = await sha256Hash_3(rlast, cert_bytes, hlast);
    }
    let hmask_buf = new Uint8Array(hmask);

    var r = bytesArrayXor(cert.signature.data, hmask_buf);
    return [r, hmask_buf];
}


function recover_pufproof_from_key(cert, loc) {
    let pubkey = cert.tbsCertificate.subjectPublicKeyInfo.subjectPublicKey.data;
    let pub_puf_proof = '';
    if(loc == 0  || loc == 2) {
        pub_puf_proof = pubkey.slice(9, 41);
    }
    else if(loc == 1) { // CA
        pub_puf_proof = pubkey.slice(8, 40);
    } else {
        //console.log("No need verify the original key.")
    }
    //console.log("pub_puf_proof", buf2hex(pub_puf_proof));
    return pub_puf_proof;
}

function verifyPubProof(cert, piProof) {
    var extval = cert.tbsCertificate.extensions.find(x => x.extnID == "subjectKeyIdentifier").extnValue;
    var rp = extval; // ignore the first two bytes
    var crp = bytesArrayXor(rp, piProof);
    //console.log("verifyPubProof", buf2hex(rp), buf2hex(crp), buf2hex(piProof));
    return isByteArrayEqual(bytesArrayXor(crp, rp), piProof);
}

async function verifyCertAndEntry(entry, rLast, tLast, cert) {

    let utf8Encode = new TextEncoder();
    var cert_bytes = tbsCertstoBytes(cert);

    var raw = new Uint8Array([
        ...rLast,
        ...utf8Encode.encode(entry.caname),
        ...utf8Encode.encode(entry.manu),
        ...entry.ts,
        ...entry.pufid,
        ...entry.comrp,
        ...cert_bytes,
        ...tLast
    ])

    var tag = await sha256Hash_arrayBuffer_1(raw);
    var tag_buf = new Uint8Array(tag);
    return isByteArrayEqual(tag_buf, entry.tag);
}




export async function acore_verify_all(certList, entryHexList) {
    accTime = 0;
    
    // Assert that there are four certificates in total
    if (certList.length !== 4 || entryHexList.length !== 4) {
        throw new Error('Invalid number of certificates');
    }


    // Initialize variables for the last signature and public key
    var rLast = '', hLast = '', piLast = '';
    var tLast = '';

    // Loop through each certificate and verify its signature
    // certList.length
    for (let i = 0; i < certList.length; i++) {
        console.log(i);
        const cert = parsePemCertificate(certList[i], true); 
        const entrybytes = hexToByteArray(entryHexList[i]);
        const entry = acoreentry.parsePBEntry(entrybytes);

        // Resolve the signature for the current certificate

        const sigs = await resolveResponseSig(cert, rLast, hLast, i);
        rLast = sigs[0];
        hLast = sigs[1];

        // console.log("Resolving R, h:", buf2hex(rLast), buf2hex(hLast));
        if (await verifyCertAndEntry(entry, rLast, tLast, cert) == false) {
            console.log('Verify Cert and Entry Failed.');
            return false;
        }
        
        // Verify the public proof for the current certificate
        if (i !== 0 && verifyPubProof(cert, piLast) == false) {
            console.log('Verify Public PUF-based Proof Failed.');
            return false;
        }

        piLast = recover_pufproof_from_key(cert, i);
        tLast = entry.tag;

    }

    return true;
}

async function getPubkeyFromCert(cert) {
    var pubkey = await crypto.subtle.importKey(
        "spki",
        getSubjectPublicKeyInfoDER(cert),
        {
            name: "RSASSA-PKCS1-v1_5",
            hash: "SHA-256"
        },
        true,
        ["verify"],
      );
    return pubkey
}

export async function normal_verify_certchain(certList) {
    // Assert that there are four certificates in total
    if (certList.length !== 4) {
        throw new Error('Invalid number of certificates');
    }

    meas_start();

    var parsed_cert_list = [];
    for(let i = 0; i < certList.length; i++) {
        parsed_cert_list.push(parsePemCertificate(certList[i], true));
    }

    var auth_pubkey;
    for(let i = 0; i < parsed_cert_list.length; i++) {
        const cert = parsed_cert_list[i]; 
        // console.log(i, cert);

        var certbytes = tbsCertstoBytes(cert)
        
        if(i == 0) {
            auth_pubkey = await getPubkeyFromCert(cert);
        } else {
            auth_pubkey = await getPubkeyFromCert(parsed_cert_list[i - 1]);
        }

        var res = await window.crypto.subtle.verify({ "name": "RSASSA-PKCS1-v1_5" }, auth_pubkey, cert.signature.data, certbytes);
        if(res !== true) {
            console.log("Verify failed");
            return false;
        }
    }
    meas_end();
    return true;
}