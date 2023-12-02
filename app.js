var http = require('http');
var server = http.createServer(function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    var message = 'It works!\n',
        version = 'NodeJS ' + process.versions.node + '\n',
        response = [message, version].join('\n');
    res.end(response);
});
server.listen();

const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
require('dotenv').config()

const token = '6800408157:AAHsbBJnS8pWnNQTRtN1mmbM1HRZVoh5HPs';
const bot = new TelegramBot(token, { polling: true });

async function getAlertData(){
    const url = 'https://alerts.com.ua/api/states';
    const headers = {
        "X-API-Key": process.env.API_KEY
    }
    try {
        const response = await axios.get(url, {headers: headers})
        return response.data
    } catch (e) {
        return e
    }
}

function formatDateTime(dateString) {
    const givenDate = new Date(dateString);
    const currentDate = new Date();

    if (currentDate > givenDate) {
        // Если текущая дата больше заданной, возвращаем полную дату
        return givenDate.toLocaleString();
    } else {
        // Иначе возвращаем только время
        return givenDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
}

let itsAlert = false;
let chatIdArr = [795080081];
let startAlertTime;
let endAlertTime;

async function fetchData() {
    const {states, last_update} = await getAlertData();

    states.forEach(state => {
        if (state.id === 19){
            if (0){
                itsAlert = state.alert;

                switch (state.alert) {
                    case true:
                        startAlertTime = formatDateTime(state.changed);
                        chatIdArr.forEach(chatId => {
                            bot.sendMessage(chatId, `🔴 **${state.name} - Повітряна тривога!**\n\nПройдіть, будь-ласка, в укриття!\n\nПочаток: ${formatDateTime(state.changed)}`,{ parse_mode: 'Markdown' })
                        })
                        break;
                    case false:
                        endAlertTime = formatDateTime(state.changed);
                        chatIdArr.forEach(chatId => {
                            bot.sendMessage(chatId, `🟢 **${state.name} - Відбій повітряної тривоги!**\n\nКінець тривоги: ${formatDateTime(state.changed)}`,{ parse_mode: 'Markdown' })
                        })
                        break;
                    default:
                        break;
                }
            }
        }
    })
}

setInterval(() => {
    fetchData();
}, 15000)

// Обработчик команды /start
bot.onText(/\/start/, async (msg) => {
    await fetchData();
    const chatId = msg.chat.id;
    chatIdArr.push(chatId)
    bot.sendMessage(chatIdArr.find(id => id === chatId), 'Привіт! Тепер я буду надсилати тобі дані про повітряну тривогу в Харківській області.');
    if (itsAlert){
        bot.sendMessage(chatId, `🔴 **У Харківській області зараз повітряна тривога!**\n\nПройдіть, будь-ласка, в укриття!${startAlertTime !== undefined ? `\n\nПочаток: ${startAlertTime}` : ''}`,{ parse_mode: 'Markdown' })
    } else {
        bot.sendMessage(chatId, `🟢 **Наразі тривоги в області немає.** ${endAlertTime !== undefined ? `\n\nОстання тривога закінчилась у такий час: ${endAlertTime}` : ''}`,{ parse_mode: 'Markdown' })
    }
});

