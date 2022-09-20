$(function() {
  cards.filter(x => x.type === "Demon").forEach((card, i) => {
    let cardName = encodeURIComponent(card.name.replace(/_/g, "_"));
    let text = `<div class="col-3 py-2 px-3 text-center"><a href="/card/${cardName}">
    <img class="mr-2" src="https://obey-me.fandom.com/wiki/Special:Redirect/file/${cardName}_icon.png" onerror="this.src='/images/reward_placeholder.png'" style="width:46%;height:auto;">
    <img src="https://obey-me.fandom.com/wiki/Special:Redirect/file/${cardName}_Unlocked_icon.png" onerror="this.src='/images/reward_placeholder.png'" style="width:46%;height:auto;">
    </a></div>`;
    $("#demon").append(text);
  });
  cards.filter(x => x.type === "Memory").forEach((card, i) => {
    if (card.rarity !== "SR") {
      let cardName = encodeURIComponent(card.name.replace(/_/g, "_"));
      let characterNum = card.characters.indexOf(character) + 1;
      let text = `<div class="col p-2 text-center"><a href="/card/${cardName}">
      <img src="https://obey-me.fandom.com/wiki/Special:Redirect/file/${cardName}_${characterNum}_icon.png" onerror="this.src='/images/reward_placeholder.png'" style="width:128px;height:auto;">
      </a></div>`;
      $("#memory").append(text);
    }
  });
});
