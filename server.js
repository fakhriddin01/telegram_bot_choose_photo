const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();
const fs = require('fs');

const bot = new TelegramBot(process.env.TELEGRAM_API_KEY, {polling: true})


bot.on('message', async msg => {
   
    try {
        if(msg.text == '/start'){
            bot.sendMessage(msg.chat.id, "Please input the subject of the photo", {
                reply_markup: JSON.stringify({
                    keyboard: [
                        [
                            {
                                text: "👍"
                            },
                            {
                                text: "👎"
                            }
                        ]
                    ],
                    resize_keyboard: true
            })
         })
        }
        if(msg.text == "👍"){
            let users = JSON.parse(fs.readFileSync("./model/like.json"))
            let user = users.find(u => u.user_id == msg.chat.id);
            bot.sendMediaGroup(msg.chat.id, user.photos)
        }

        if(msg.text == "👎"){
            let users = JSON.parse(fs.readFileSync("./model/dislike.json"))
            let user = users.find(u => u.user_id == msg.chat.id);
            bot.sendMediaGroup(msg.chat.id, user.photos)
        }
        if(msg.text != "/start" && msg.text != "👍" && msg.text != "👎"){
            let subject = msg.text
            let num =3
            let result = await fetch(`https://api.pexels.com/v1/search?query=${subject}&per_page=${num}`)

            let photo = await result.json();
            bot.sendPhoto(msg.chat.id, photo.photos[0].url, {
                reply_markup: JSON.stringify({
                    inline_keyboard: [
                        [
                            {
                                text: "👍",
                                callback_data: "image_like"
                            },
                            {
                                text: "👎",
                                callback_data: "image_dislike"
                            }
                        ]
                    ],
                    resize_keyboard: true,
                    
            })
            })
        }
        

    } catch (error) {
        console.log(error);
    }

})

bot.on('callback_query', async msg => {
    if(msg.data == 'image_like'){
        let chat_id = msg.from.id
        let users = JSON.parse(fs.readFileSync("./model/like.json"))
        let dislike_users = JSON.parse(fs.readFileSync("./model/dislike.json"))
        let user = users.find(u => u.user_id == chat_id);
        let dislike_user = dislike_users.find(u => u.user_id == chat_id);
        if(!user){
            users.push({user_id: chat_id, photos: []})
            user = users.find(u => u.user_id == chat_id);
        }
        let photo = msg.message.photo[0].file_id
        if(user.photos.find(u => u.media == photo)){
            return
        }else{
            user.photos.push({type: "photo", media: photo})
            dislike_user.photos.forEach((obj, inx) => {
                if(obj.media == photo){
                    dislike_user.photos.splice(inx, 1);
                    return;
                }
            })

            fs.writeFile("./model/dislike.json", JSON.stringify(dislike_users, null, 4), (err) => {
                if(err){
                    console.log(err);
                }
                })
            
            fs.writeFile("./model/like.json", JSON.stringify(users, null, 4), (err) => {
            if(err){
                console.log(err);
            }
            })
            bot.sendMessage(msg.from.id, "image added to liked list")

        }
    }

    if(msg.data == 'image_dislike'){
        let chat_id = msg.from.id
        let users = JSON.parse(fs.readFileSync("./model/dislike.json"))
        let liked_users = JSON.parse(fs.readFileSync("./model/like.json"))
        let user = users.find(u => u.user_id == chat_id);
        let liked_user = liked_users.find(u => u.user_id == chat_id);
        if(!user){
            users.push({user_id: chat_id, photos: []})
            user = users.find(u => u.user_id == chat_id);
        }
        let photo = msg.message.photo[0].file_id
        if(user.photos.find(u => u.media == photo)){
            return
        }else{
            user.photos.push({type: "photo", media: photo})
            liked_user.photos.forEach((obj, inx) => {
                if(obj.media == photo){
                    liked_user.photos.splice(inx, 1);
                    return;
                }
            })
            fs.writeFile("./model/like.json", JSON.stringify(liked_users, null, 4), (err) => {
                if(err){
                    console.log(err);
                }
            })
            fs.writeFile("./model/dislike.json", JSON.stringify(users, null, 4), (err) => {
                if(err){
                    console.log(err);
                }
            })
        }

        bot.sendMessage(msg.from.id, "image added to disliked list")
    }
    
})





