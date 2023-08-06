// ****************************************
// kuronuri
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

function drawRect(x1: number ,y1: number ,x2: number, y2: number): void {
    const canvas = document.getElementById("orig") as HTMLCanvasElement;

    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = "black";

    const left = Math.min(x1, x2) + 1;
    const top = Math.min(y1, y2) + 1;
    const width = Math.max(1, Math.abs(x1 - x2) - 2);
    const height = Math.max(1, Math.abs(y1 - y2) - 2);


    ctx.fillRect(left, top, width, height);
}

let drag = false;
let startX: number = 0;
let startY: number = 0;

function onMouseDown(event: MouseEvent): void {
    startX = event.offsetX;
    startY = event.offsetY;
    drag = true;
    document.getElementById("box")!.classList.remove("hide");
}

function onMouseUp(event: MouseEvent): void {
    drag = false;
    document.getElementById("box")!.classList.add("hide");
    drawRect(startX, startY, event.offsetX, event.offsetY);
}

function onMouseMove(event: MouseEvent): void {
    if (drag) {
        const box = document.getElementById("box")!;
        box.style.left = `${ window.scrollX + event.clientX + Math.min(startX, event.offsetX) - event.offsetX + 1 }px`;
        box.style.top = `${ window.scrollY + event.clientY + Math.min(startY, event.offsetY) - event.offsetY + 1 }px`;
        box.style.width = `${ Math.max(1, Math.abs(startX - event.offsetX) - 2) }px`;
        box.style.height = `${ Math.max(1, Math.abs(startY - event.offsetY) - 2) }px`;
    }
}

function onMouseMoveInBox(event: MouseEvent): void {
    if (drag) {
        const box = document.getElementById("box")!;
        box.style.width = `${Math.max(1,event.offsetX-2)}px`;
        box.style.height = `${Math.max(1,event.offsetY-2)}px`;
    }
}

function convertToImage(): void {
    const div = document.getElementById("imgcont") as HTMLDivElement;
    let img: HTMLImageElement | null = div.querySelector("img");
    if (img === null) {
        img = div.appendChild(document.createElement("img"));
        img.alt = "image.png";
        img.title = "image.png";
    }
    const canvas = document.getElementById("orig") as HTMLCanvasElement;
    img.width = canvas.width;
    img.height = canvas.height
    img.src = canvas.toDataURL();
}

document.addEventListener("paste", pasteImage);
document.getElementById("imgfile")!.addEventListener("change", uploadImage);

document.getElementById("orig")!.addEventListener("mousedown", onMouseDown);
document.getElementById("orig")!.addEventListener("mouseup", onMouseUp);
document.getElementById("orig")!.addEventListener("mousemove", onMouseMove);
document.getElementById("box")!.addEventListener("mousemove", onMouseMoveInBox);
document.getElementById("button")!.addEventListener("click", () => convertToImage());
