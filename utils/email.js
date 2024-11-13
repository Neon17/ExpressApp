const nodemailer = require('nodemailer');

const sendEmail = async (options)=>{
    //create a transporter
    var transport = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        },
        tls: {
            ciphers:'SSLv3',
            rejectUnauthorized:false 
            //it may be necessary because only https can access the maildrop generally
        },
        requireTLS:true,
    });


    //define email options
    const emailOptions = {
        from:  `UPTO100 support<support@upto100.com>`,
        to: options.email,
        subject: options.subject,
        text: options.message
    }

    await transport.sendMail(emailOptions);
}

module.exports = sendEmail;
