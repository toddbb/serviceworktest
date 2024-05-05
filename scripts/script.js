const $testImages = [
	"https://i.imgur.com/JocyXBD.jpeg",
	"https://i.imgur.com/6vt7kEI.gif",
	"https://i.imgur.com/LKLhatB.jpeg",
	"https://i.imgur.com/WIrkVuG.jpeg",
];

const Load_Content = {
	contentImagesParent: document.getElementById("images"),

	insertImages(imageUrls) {
		imageUrls.forEach((url, i) => {
			let img = document.createElement("img");
			img.src = url;
			img.id = "img" + i;
			this.contentImagesParent.append(img);
		});
	},

	async init() {
		const imagePromises = $testImages.map(async (img) => {
			try {
				let imgUrl = await HttpRequest.getImage(img);
				return imgUrl;
			} catch (error) {
				console.log(`[init(), getting images] Error -- ${error}`);
			}
		});

		// Wait for all promises to resolve
		const imageUrls = await Promise.all(imagePromises);
		this.insertImages(imageUrls);
	},
};

const HttpRequest = {
	async getImage(imgPath) {
		try {
			const response = await fetch(imgPath, this.fetchSettings);
			const blob = await response.blob();
			const imgUrl = URL.createObjectURL(blob);
			console.log(`Fetched from "server": ${imgUrl}`);
			return imgUrl;
		} catch (error) {
			console.error("There was a problem with the fetch operation:", error);
			throw error;
		}
	},
};

const init = async () => {
	console.log("The DOM is loaded.");
	Load_Content.init();
};

document.addEventListener("DOMContentLoaded", () => init());
