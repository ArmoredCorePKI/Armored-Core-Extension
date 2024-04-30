// //var tl = require("../protos/trillian_log_api_pb.js");
// // var ta = require();
// var grpc = require('@grpc/grpc-js');

// // import { GetEntryAndProofRequest } from "../protos/trillian_log_api_pb.js"
// // import { TrillianLogClient } from "../protos/trillian_log_api_grpc_pb.js"
// //import { credentials } from 'grpc/grpc-js'

// export function client_conn_test() {
//     console.log("in client_conn_test")
//     let target = '10.168.1.101:50054';
//     let client = new TrillianLogClient(target, grpc.credentials.createInsecure());
//     console.log("client connection right")
//     let req = new GetEntryAndProofRequest()
//     req.setLogId(8438661973015862380)
//     req.setLeafIndex(1)
//     req.setTreeSize(2)

//     client.getEntryandProof(req, function(err, response){
//         console.log("Entry result", response, typeof(response));
//     })
// }


// // exports.client_conn_test = client_conn_test
