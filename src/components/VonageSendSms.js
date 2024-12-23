const { Vonage } = require('@vonage/server-sdk')

const vonage = new Vonage({
  apiKey: "b81fdaf8",
  apiSecret: "jhyHRsjnn5kexaBE"
})

const from = "Vonage APIs"
const to = "258840237100"
const text = 'A text message sent using the Vonage SMS API'

async function sendSMS() {
    await vonage.sms.send({to, from, text})
        .then(resp => { console.log('Message sent successfully'); console.log(resp); })
        .catch(err => { console.log('There was an error sending the messages.'); console.error(err); });
}

sendSMS();