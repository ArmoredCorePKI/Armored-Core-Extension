'use strict'

import { acore_verify_all, normal_verify_certchain } from "../js_lib/acore_util.js"
import { fullchain_cert, fullchain_cert_original } from "../js_lib/acore_fixed_cert.js"
import { fullchain_entry_hex } from "../js_lib/acore_fixed_entry.js"
// import { client_conn_test } from "../trillianclient/trillianclient.js";


async function ACoreMain() {
    console.log("ACoreMain");
    console.log("Chain length", fullchain_cert.length, fullchain_entry_hex.length); // local certs for test
    
    var res = await acore_verify_all(fullchain_cert, fullchain_entry_hex);
    // var res = await normal_verify_certchain(fullchain_cert_original);
    if(res === true)
    {
        console.log("Verify Passed!");
    }
    else
    {
        console.log("Verify Failed!");
    }
    // client_conn_test();

}




/*
Listen for all onHeadersReceived events.
*/
browser.webRequest.onHeadersReceived.addListener(ACoreMain,
  {urls: ["https://github.com/ArmoredCorePKI/Armored-Core"]},
  ["blocking"]
);

