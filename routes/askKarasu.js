const express = require("express");
const askKarasuController = require("../controllers/askKarasuController");
const router = express.Router();


router.get("/:question", askKarasuController.getAskKarasuPage);


module.exports = router;
