const express = require("express");
const askKarasuController = require("../controllers/askKarasuController");
const router = express.Router();


// router.get("/:question", askKarasuController.getAskKarasuPage);
router.get("/dt_rewards", askKarasuController.getDTRewardsPage);
router.get("/card_unlock_items", askKarasuController.getUnlockItemsPage);
router.get("/majolish_cards", askKarasuController.getMajolishCardsPage);
router.get("/skill_charge_time", askKarasuController.getSkillChargeSpeedPage);
router.get("/skills", askKarasuController.getSkillsPage);



module.exports = router;
