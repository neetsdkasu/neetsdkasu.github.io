// srcipt

const msg = document.getElementById("msg");
msg.textContent = "loading...";

let ok = false;
const img = new Image();
img.onload = () => {
	ok = true;
	msg.textContent = "loaded";
};
img.src = "./mjgraph/image.jpg";

const canvas = document.getElementById("canvas");

function run() {
	msg.textContent = "...";
	if (!ok) {
		msg.textContent = "loading...";
		return;
	}
	const allpai = [];
	for (let i = 0; i < 9; i++) {
		allpai.push(i, i, i, i);
	}
	for (let i = allpai.length; i > 0; i--) {
		const j = Math.floor(Math.random() * i);
		const t = allpai[i-1];
		allpai[i-1] = allpai[j];
		allpai[j] = t;
	}
	const pais = allpai.slice(0,14);
	pais.sort( (a,b) => a-b );

	const ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.strokeRect(0, 0, canvas.width, canvas.height);
	const centerX = canvas.width / 2;
	const centerY = canvas.height / 2;
	const range = Math.min(centerX, centerY) - 32;

	const xs = [];
	const ys = [];
	const pxs = [];
	const pys = [];
	
	for (let i = 0; i < 14; i++) {
		const x = range * Math.cos(i * 2 * Math.PI / 14) + centerX - 24;
		const y = range * Math.sin(i * 2 * Math.PI / 14) + centerY - 32;
		xs.push(x);
		ys.push(y);
		const px = (pais[i] % 9);
		const py = Math.floor(pais[i] / 9);
		pxs.push(px);
		pys.push(py);
	}
	for (let i = 0; i < 14; i++) {
		const px1 = pxs[i];
		const py1 = pys[i];
		for (let j = i+1; j < 14; j++) {
			const px2 = pxs[j];
			const py2 = pys[j];
			if (py1 !== py2) { continue; }
			if (py1 < 3 && Math.abs(px1 - px2) < 3) {
				ctx.beginPath();
				ctx.moveTo(xs[i]+24,ys[i]+32);
				ctx.lineTo(xs[j]+24,ys[j]+32);
				ctx.stroke();
			} else if (py1 == 3 && px1 == px2) {
				ctx.beginPath();
				ctx.moveTo(xs[i]+24,ys[i]+32);
				ctx.lineTo(xs[j]+24,ys[j]+32);
				ctx.stroke();
			}	
		}
	}
	
	for (let i = 0; i < 14; i++) {
		ctx.drawImage(img, pxs[i]*48, pys[i]*64, 48, 64, xs[i], ys[i], 48, 64);
	}
}


document.getElementById("button").addEventListener("click", () => {
	run();	
});