import axios from "axios";
import nodemailer from "nodemailer";
import {exec} from "child_process";
import config from './config.json' assert { type: 'json' };
let from = "Dinajpur"
let to = "Dhaka"
let date = "14-Apr-2024"
let trainCode = "758"
let waitTiem = 5000
let seatType = "S_CHAIR"
//get argument -t for to -f for from -d for date -t for delay
const args = process.argv.slice(2)
args.forEach(arg => {
    if (arg === '-f') {
        from = args[args.indexOf(arg) + 1]
    }
    if (arg === '-t') {
        to = args[args.indexOf(arg) + 1]
    }
    if (arg === '-d') {
        const t = date.slice(2)

        date = args[args.indexOf(arg) + 1] + t
        console.log(date)
    }
    if (arg === '-w') {
        waitTiem = args[args.indexOf(arg) + 1]
    }
    if (arg === '-s') {
        seatType = args[args.indexOf(arg) + 1]
    }
    if (arg === '-c') {
        trainCode = args[args.indexOf(arg) + 1]
    }
})
if (args.includes('-h')) {
    console.log(' -f for from -t for to -d for date -w for wait time -c for train code -s for seat type')
//example
    console.log(`node index.mjs -f ${from} -t ${to} -d ${date} -w ${waitTiem} -c ${trainCode} -s ${seatType}`)
    process.exit(0)

}


function playSound() {
    exec('mpv biohazard-alarm-143105.mp3', (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);

        // Call executeProcess again to execute the process after it finishes
        playSound();
    });
}

async function notify(trainNamd, seatCount) {
    playSound();
    return new Promise(async (res) => {
        await sendReminderToEmail(seatCount, trainNamd)
        console.log('email send')

    })
}

const url = `https://railspaapi.shohoz.com/v1.0/web/bookings/search-trips-v2?from_city=${from}&to_city=${to}&date_of_journey=${date}&seat_class=${seatType}`
console.log(url)

async function getTrainInfo(from, to, date, trainCode, seatType) {

    const response = await axios.get(url).catch((err) => err);
    if (!response) {
        console.log("Error")
        console.log(response)
        return;
    }
    const data = response.data
    const trainfound = data?.data?.trains?.find(train => {
        return train.trip_number.includes(trainCode)
    })
    if (!trainfound) {
        console.log('no Train found')
    }
    const hasSeat = trainfound?.seat_types?.find(seat => {
        return (seat.type === seatType && seat.seat_counts.online > 0)
    })

    if (!hasSeat) {
        console.log('no seat found')
        return;
    }
    await notify(trainfound.trip_number, hasSeat.seat_counts.online)


}

async function main() {
    await getTrainInfo(from, to, date, trainCode, seatType)
    await sleep(waitTiem)
    main();
}

main()

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendReminderToEmail(seats, nameOfTrain) {
    if (!config) return
const eurl = `https://eticket.railway.gov.bd/booking/train/search?fromcity=${from}&tocity=${to}&doj=${date}&class=${seatType}`;
    const transporter = nodemailer.createTransport({
        host: config.smtp,
        port: 587,
        auth: {
            user: config.user,
            pass: config.pass
        }
    });
// Message object
    let message = {
        from: 'Train bot <bot@trainbot.com>',
        to: 'Recipient <sarowarhosen03@gmail.com>',
        subject: 'Ticket found✔',
        text: 'Hello ',
        html: ` <p>${from}-${to} (${date}) ${seats} seat available   in ${nameOfTrain} </p> <a href="${eurl}">${eurl}</a>`
    };

    transporter.sendMail(message, async (err, info) => {
        if (err) {
            console.log('Error occurred. ' + err.message);
            return process.exit(1);
        }


    });

}


