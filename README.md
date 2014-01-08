ios-pushtest
============

Need to quickly setup a service to send push notifications to your iOS app?

Well you've come to the right place!

Quick Start
===========
    $ git clone https://github.com/ghafran/ios-pushtest.git
    $ cd ios-pushtest
    $ npm install
    $ node server.js

Now browse to http://localhost:3000/

Create APN Certs
================
Before you can send push notifications via APN service, you will need to create push certs from Apple's developer portal.

After requesting the certificate from Apple, export your private key as a .p12 file and download the .cer file from the iOS Provisioning Portal.

Now, in the directory containing cert.cer and key.p12 execute the following commands to generate your .pem files:

    $ openssl x509 -in cert.cer -inform DER -outform PEM -out cert.pem
    $ openssl pkcs12 -in key.p12 -out key.pem -nodes

Copy the certs into the certs/apn folder.

Modify the line in server.js
    
    process.env.NODE_ENV = 'development'
    
to set the appropriate environment (development, staging, production).

If you use the development env, no pushes are actually sent.




