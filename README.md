# Armored Core Extension

This extension is merely a functional skeleton to obtain the performance benchmark in the client browser environment. It only provides essential functions of Armored Core validation.

## File Structure

- **manifest.json**: necessary manifest file of Mozilla Web Extension
- **background/background.js**: entry point of armored core verify functions
- **js_lib**: helper JS functions that are browserified from NodeJS environment. Some files are from [F-PKI](https://github.com/cyrill-k/fpki-firefox-extension/tree/main) (Sincerely appreciated)
  - acore_fixed_cert.js: hardcoded pem-encoded TLS certificate chain to ease the test
  - acore_fixed_entry.js: hardcoded PUF invocation entry bytes (encoded by [pbf](https://github.com/mapbox/pbf)). These entries are related to the fixed certificates above.
  - acore_util.js: contains the certificate validation function to verify the cert chain and entry chain, just like Algorithm 1 in the paper.

## Deployment

- Running like any other Mozilla Web Extension. A recommended way is to use `web-ext` tool

```bash
cd extension_dir
web-ext run
```


- Then Ctrl/Cmd+Shift+J to invoke the browser console, select *Multiprocess (slower)*

- Access `https://github.com/ArmoredCorePKI/Armored-Core`, and we can see the output log from the extension.

## Remark

- This extension is currently for the test of validation benchmark in the browser. Htmls and style sheets for better displaying are not developed yet.
- The certificates and entries are hardcoded since enabling the gRPC connection for browser JS is a little bit tricky (sorry about that). We will improve the functionality of this extension in the future :-)
- One can use function `meas_start` and `meas_end` to acquire the elapsed time of the functions

