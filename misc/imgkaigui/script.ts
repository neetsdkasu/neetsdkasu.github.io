// ****************************************
// imgkaigui
//
// author: Leonardone @ NEETSDKASU
// ****************************************
// Development Environment
//  $ cmd /C "VER"
//  Microsoft Windows [Version 6.1.7601]
//  $ node --version
//  v8.11.2
//  $ tsc --version
//  Version 3.8.3

function updateRetouchImage(): void {
    const orig = document.getElementById("orig") as HTMLCanvasElement;
    const origWidth = orig.width;
    const origHeight = orig.height;

    const canvas = document.getElementById("retouch") as HTMLCanvasElement;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const target = parseInt((document.getElementById("target") as HTMLSelectElement).value);

    const clipLeft = (target & 4) === 0 ? 0 : (canvasWidth / 2);
    const clipTop = (target & 2) === 0 ? 0 : (canvasHeight / 2);
    const clipWidth = (target & (4|8)) === 0 ? canvasWidth : (canvasWidth / 2);
    const clipHeight = (target & (1|2)) === 0 ? canvasHeight : (canvasHeight / 2);

    ctx.save();

    ctx.beginPath();
    ctx.rect(clipLeft, clipTop, clipWidth, clipHeight);
    ctx.clip();

    const horizontal = document.getElementById("horizontal") as HTMLInputElement;
    const dx = clipLeft - parseInt(horizontal.value);

    const vertical = document.getElementById("vertical") as HTMLInputElement;
    const dy = clipTop - parseInt(vertical.value);

    const resize = parseFloat((document.getElementById("resize") as HTMLInputElement).value);
    const dWidth = origWidth * resize / 1000.0;
    const dHeight = origHeight * resize / 1000.0;

    ctx.drawImage(orig, dx, dy, dWidth, dHeight);

    ctx.restore();

}


function resetRetouchImage(): void {

    const orig = document.getElementById("orig") as HTMLCanvasElement;
    const origWidth = orig.width;
    const origHeight = orig.height;

    const horizontal = document.getElementById("horizontal") as HTMLInputElement;
    horizontal.value = "0";
    horizontal.max = `${origWidth * 2}`;
    (document.getElementById("horizontal_value") as HTMLOutputElement).value = horizontal.value;

    const vertical = document.getElementById("vertical") as HTMLInputElement;
    vertical.value = "0";
    vertical.max = `${origHeight * 2}`;
    (document.getElementById("vertical_value") as HTMLOutputElement).value = vertical.value;

    const resize = document.getElementById("resize") as HTMLInputElement;
    resize.value = "1000";
    (document.getElementById("resize_value") as HTMLOutputElement).value = `${parseFloat(resize.value)/10}%`;

    const target = document.getElementById("target") as HTMLSelectElement;
    target.value = "0";

    updateRetouchImage();
}


function showOriginalImage(blob: Blob): void {
    createImageBitmap(blob).then( image => {

        // 値を0,90,180,270にしている意味なしｗ
        const rotate = parseInt((document.getElementById("rotate") as HTMLInputElement).value);

        const canvas = document.getElementById("orig") as HTMLCanvasElement;

        switch (rotate) {
            case 0:
            case 180:
                canvas.width = image.width;
                canvas.height = image.height;
                break;
            case 90:
            case 270:
                canvas.width = image.height;
                canvas.height = image.width;
                break;
        }

        const info = document.getElementById("imginfo") as HTMLElement;
        info.textContent = `width: ${canvas.width}, heigth: ${canvas.height}`;

        const ctx = canvas.getContext("2d")!;

        ctx.save();

        switch (rotate) {
            case 0:
                ctx.drawImage(image, 0, 0);
                break;
            case 90:
                ctx.rotate(90 * Math.PI / 180);
                ctx.drawImage(image, 0, -image.height);
                break;
            case 180:
                ctx.rotate(180 * Math.PI / 180);
                ctx.drawImage(image, -image.width, -image.height);
                break;
            case 270:
                ctx.rotate(270 * Math.PI / 180);
                ctx.drawImage(image, -image.width, 0);
                break;
        }

        ctx.restore();

        image.close();

        resetRetouchImage();
    }).catch( err => {
        alert(`ERROR: ${err}`);
        console.log(err);
    });
}


function uploadImage(event: Event): void {

    const input = document.getElementById("imgfile") as HTMLInputElement;

    const files = input.files;
    if (files === null) { return; }
    if (files.length === 0) { return; }

    for (const file of files) {
        if (file.type.match(/^image\//)) {
            showOriginalImage(file);
            break;
        }
    }

}

function pasteImage(e: Event): void {
    const clipboardData = (e as ClipboardEvent).clipboardData;
    if (clipboardData === null) {
        alert("Unsupported");
        return;
    }
    for (const item of clipboardData.items) {
        if (item.kind !== "file") { continue; }
        if (!item.type.match(/^image\//)) { continue; }
        const file = item.getAsFile();
        if (file === null) { continue; }
        showOriginalImage(file);
        return;
    }
    alert("the paste dose not have a image");
}


function changeTarget(): void {
    updateRetouchImage();
}


function showPhoneImage(): void {
    const div = document.getElementById("images") as HTMLDivElement;
    let img: HTMLImageElement | null = div.querySelector("img.phone");
    if (img === null) {
        img = div.appendChild(document.createElement("img"));
        img.width = 120;
        img.height = 160;
        img.classList.add("phone");
        img.alt = "phone.png";
        img.title = "phone.png";
    }
    img.src = (document.getElementById("phone") as HTMLCanvasElement).toDataURL();
}


function resizeToPhoneImage(): void {

    const canvas = document.getElementById("phone") as HTMLCanvasElement;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const stamped = document.getElementById("stamped") as HTMLCanvasElement;

    ctx.drawImage(stamped, 0, 0, canvasWidth, canvasHeight);

    showPhoneImage();
}


function showStampedImage(): void {
    const div = document.getElementById("images") as HTMLDivElement;
    let img: HTMLImageElement | null = div.querySelector("img.stamped");
    if (img === null) {
        img = div.appendChild(document.createElement("img"));
        img.width = 240;
        img.height = 320;
        img.classList.add("stamped");
        img.alt = "stamped.png";
        img.title = "stamped.png";
    }
    img.src = (document.getElementById("stamped") as HTMLCanvasElement).toDataURL();
}


function stampDate(): void {

    const canvas = document.getElementById("stamped") as HTMLCanvasElement;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const merged = document.getElementById("merged") as HTMLCanvasElement;
    ctx.drawImage(merged, 0, 0, canvasWidth, canvasHeight);

    const date = (document.getElementById("date") as HTMLInputElement).value.replace("-", ".").replace("-", ".");

    ctx.font = "bold 18px monospace";
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.direction = "ltr";

    ctx.fillStyle = "white";
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            ctx.fillText(date, canvasWidth + dx - 3, canvasHeight + dy - 3);
        }
    }
    ctx.fillStyle = "black";
    ctx.fillText(date, canvasWidth - 3, canvasHeight - 3);

    showStampedImage();

    resizeToPhoneImage();
}


function showMergedImage(): void {
    const div = document.getElementById("images") as HTMLDivElement;
    let img: HTMLImageElement | null = div.querySelector("img.marged");
    if (img === null) {
        img = div.appendChild(document.createElement("img"));
        img.width = 240;
        img.height = 320;
        img.classList.add("marged");
        img.alt = "marged.png";
        img.title = "marged.png";
    }
    img.src = (document.getElementById("merged") as HTMLCanvasElement).toDataURL();
}


function mergeRetouchedImage(): void {

    const canvas = document.getElementById("merged") as HTMLCanvasElement;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    const ctx = canvas.getContext("2d")!;

    const retouched = document.getElementById("retouch") as HTMLCanvasElement;

    const target = parseInt((document.getElementById("target") as HTMLSelectElement).value);

    const x = (target & 4) === 0 ? 0 : (canvasWidth / 2);
    const y = (target & 2) === 0 ? 0 : (canvasHeight / 2);
    const width = (target & (4|8)) === 0 ? canvasWidth : (canvasWidth / 2);
    const height = (target & (1|2)) === 0 ? canvasHeight : (canvasHeight / 2);

    ctx.drawImage(retouched, x, y, width, height, x, y, width, height);

    showMergedImage();

    stampDate();
}


function moveHorizontalRetouchImage(event: Event): void {
    const input = document.getElementById("horizontal") as HTMLInputElement;
    const output = document.getElementById("horizontal_value") as HTMLOutputElement;
    output.textContent = input.value;
    updateRetouchImage();
}


function moveVerticalRetouchImage(event: Event): void {
    const input = document.getElementById("vertical") as HTMLInputElement;
    const output = document.getElementById("vertical_value") as HTMLOutputElement;
    output.textContent = input.value;
    updateRetouchImage();
}


function resizeRetouchImage(event: Event): void {
    const input = document.getElementById("resize") as HTMLInputElement;
    const output = document.getElementById("resize_value") as HTMLOutputElement;
    output.textContent = `${parseFloat(input.value)/10}%`;
    updateRetouchImage();
}


document.addEventListener("paste", pasteImage);
document.getElementById("imgfile")!.addEventListener("change", uploadImage);
document.getElementById("horizontal")!.addEventListener("input", moveHorizontalRetouchImage);
document.getElementById("vertical")!.addEventListener("input", moveVerticalRetouchImage);
document.getElementById("resize")!.addEventListener("input", resizeRetouchImage);
document.getElementById("target")!.addEventListener("input", () => changeTarget());
document.getElementById("merge_button")!.addEventListener("click", () => mergeRetouchedImage());
document.getElementById("date")!.addEventListener("change", () => stampDate());

(document.getElementById("date") as HTMLInputElement).value = (d => (d.setMinutes(d.getMinutes() - d.getTimezoneOffset()), d))(new Date())
    .toISOString().replace(/\D?(\d{4}-\d{2}-\d{2})T.+$/, "$1");

