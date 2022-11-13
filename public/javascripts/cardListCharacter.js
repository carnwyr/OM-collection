const { createApp } = Vue;
createApp({
	data: () => ({
		source: "",
		rarity: "",
		attribute: "",
		display: "icon",
		cards: {
			demon: [],
			memory: []
		}
	}),
	created() {
		this.fetchData();
	},
	methods: {
		async fetchData() {
			let url = "/getCards2?characters=" + character;
			if (this.source) url += "&source=" + this.source;
			if (this.rarity) url += "&rarity=" + this.rarity;
			if (this.attribute) url += "&attribute=" + this.attribute;

			let cards = (await (await fetch(url)).json()).cards;
			this.cards.demon = cards.filter(x => x.type === "Demon");
			this.cards.memory = cards.filter(x => x.type === "Memory");
		},
		getSource(name) {
			let size = this.display === "icon" ? "S" : "L";
			let unlocked = this.display === "unlocked" ? "_b" : "";
			return `/images/cards/${size}/${name}${unlocked}.jpg`;
		}
	},
	computed: {
		containerClass() {
			return this.display === "icon" ? "icon-container" : "full-container";
		}
	}
}).mount("#app");
