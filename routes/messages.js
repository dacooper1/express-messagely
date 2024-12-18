const express = require("express");


const router = new express.Router();
const {ensureLoggedIn, ensureCorrectUser} = require("../middleware/auth");
const Message = require("../models/message");
const ExpressError = require("../expressError");

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/

router.get("/:id", ensureLoggedIn, async function(req, res, next){
    try {
        const message = await Message.get(req.params.id);
        const username = req.user.username;

        if (message.to_user.username !== username && message.from_user.username !== username) {
            throw new ExpressError("Cannot read this message", 401);
        } 

        return res.json({message}) 
    } catch (e) {
        next(e)
    }
})


/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post("/", ensureLoggedIn, async function(req, res, next) {
    try {
        console.log("req.user:", req.user.username); 
        const {to_username, body} = req.body;
        const from_username = req.user.username;

        const newMsg = await Message.create({from_username, to_username, body})

        return res.json({newMsg})
    } catch (e) {
        next(e)
    }
})


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

router.post("/:id/read", ensureLoggedIn, async function(req, res, next) {
    try {
        let username = req.user.username;
        let message = await Message.get(req.params.id)
        
        if (message.to_user.username !== username) {
            throw new ExpressError("Cannot set this message to read", 401);
          }
        const msg = await Message.markRead(req.params.id);
        return res.json({msg});

    } catch (e) {
        next(e)
    }
    
})

module.exports = router;
