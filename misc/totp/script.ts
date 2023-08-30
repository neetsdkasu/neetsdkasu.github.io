// ****************************************
//
// TOTP
//
// ****************************************
//
// Development Environment
//  $ cmd /C "VER"
//  Microsoft Windows [Version 6.1.7601]
//  $ node --version
//  v8.11.2
//  $ tsc --version
//  Version 3.8.3
//
// ****************************************
//
// References:
//   - Algorithm TOTP
//      https://www.ietf.org/rfc/rfc6238.txt
//   - URI optauth format
//      https://github.com/google/google-authenticator/wiki/Key-Uri-Format
//
// ****************************************

function toInt(s: string): number {
    const n = parseInt(s);
    return isNaN(n) ? 0 : n;
}

function nowUnixEpoch(): number {
    return Math.floor(Date.now() / 1000);
}

function toBytes(s: string): ArrayBuffer {
    if (s.length % 2 === 1) {
        s = "0" + s;
    }
    const buf = new ArrayBuffer(Math.floor(s.length / 2));
    const arr = new Uint8Array(buf);
    for (let i = 0; i < arr.length; i++) {
        arr[i] = parseInt(s.slice(i * 2,  i * 2 + 2), 16);
    }
    return buf;
}

function fromBase64(s: string): ArrayBuffer {
    return Uint8Array.from(atob(s), c => c.codePointAt(0) ?? 0).buffer.slice(0);
}

function errMsg(err: any): void {
    const msg = `${err}`;
    document.getElementById("err")!.textContent = msg;
    if (err !== "") {
        console.log(err);
    }
}

function infoMsg(msg: string): void {
    document.getElementById("info")!.textContent = msg;
}

function isChecked(id: string): boolean {
    const elem = document.getElementById(id);
    if (elem !== null) {
        if (elem instanceof HTMLInputElement) {
            return elem.checked;
        }
    }
    return false;
}

function getStr(id: string): string {
    const elem = document.getElementById(id);
    if (elem !== null) {
        if (elem instanceof HTMLInputElement) {
            if (elem.value) {
                return elem.value;
            }
        }
        if (elem instanceof HTMLSelectElement) {
            if (elem.value) {
                return elem.value;
            }
        }
    }
    return "";
}

function getInt(id: string): number {
    return toInt(getStr(id));
}

function setValue(id: string, value: string): void {
    const elem = document.getElementById(id);
    if (elem !== null) {
        if (elem instanceof HTMLInputElement) {
            elem.value = value;
        } else if (elem instanceof HTMLSelectElement) {
            elem.value = value;
        }
    }
}

const LOCAL_STORAGE_PATH = "neetsdkasuTOTP";

interface TotpUri {
    label: string;
    datetime: number;
    uri: string;
}

function disabledTotpUriListService() {
    document.getElementById("description")!.textContent = "";
    (document.getElementById("saved") as HTMLSelectElement).disabled = true;
    (document.getElementById("getBySavedUri") as HTMLButtonElement).disabled = true;
    (document.getElementById("deleteSavedUri") as HTMLButtonElement).disabled = true;
    (document.getElementById("showSavedUri") as HTMLButtonElement).disabled = true;
}

function getTotpUriList(): TotpUri[] {
    try {
        const json = window.localStorage.getItem(LOCAL_STORAGE_PATH);
        if (json === null) {
            return [];
        }
        return JSON.parse(json) as TotpUri[];
    } catch (err) {
        disabledTotpUriListService();
        return [];
    }
}

function addToTotpUriList(uri: string): boolean {
    const u = new URL(uri.replace("otpauth:", "https:"));
    const newItem: TotpUri = {
        label: decodeURI(u.pathname).slice(1),
        datetime: Date.now(),
        uri: uri
    };
    const list = getTotpUriList();
    const exists = list.findIndex(e => e.label === newItem.label);
    if (exists < 0) {
        list.push(newItem);
    } else {
        list[exists] = newItem;
    }
    try {
        const json = JSON.stringify(list);
        window.localStorage.setItem(LOCAL_STORAGE_PATH, json);
        return true;
    } catch (err) {
        return false;
    }
}

function deleteFromTotpUriList(label: string): boolean {
    const list = getTotpUriList();
    const exists = list.findIndex(e => e.label === label);
    if (exists < 0) {
        return false;
    }
    const list1 = list.slice(0, exists);
    const list2 = list.slice(exists + 1);
    const newList = list1.concat(list2);
    try {
        const json = JSON.stringify(newList);
        window.localStorage.setItem(LOCAL_STORAGE_PATH, json);
        return true;
    } catch (err) {
        return false;
    }
}

function showTotpUriList(label?: string): void {
    const elem = document.getElementById("saved") as HTMLSelectElement;
    elem.innerHTML = "";
    for (const item of getTotpUriList()) {
        const option = elem.appendChild(document.createElement("option"));
        option.value = item.label;
        option.textContent = item.label;
        option.selected = item.label === label;
    }
}

interface TotpRequest {
    tokenType: string;
    secretToken: string;
    timeSteps: number;
    initialTime: number;
    totpLength: number;
    hashKind: string;
    useSpecialTime: boolean;
    specialTime: number;
}

async function generateTotp(req: TotpRequest): Promise<string> {
    if (!window.isSecureContext) {
        throw "REQUIRE SECURE CONTEXT";
    }

    const time = req.useSpecialTime ? req.specialTime : nowUnixEpoch();

    const T = Math.floor((time - req.initialTime) / req.timeSteps);

    const msg = toBytes(BigInt(T).toString(16).padStart(16, "0"));
    const key = (req.tokenType === "base64") ? fromBase64(req.secretToken) : toBytes(req.secretToken);

    const algorithm = {
        name: "HMAC",
        hash: req.hashKind
    };

    const totpLength = req.totpLength;

    const cryptoKey = await window.crypto.subtle.importKey(
        "raw",
        key,
        algorithm,
        false,
        ["sign"]
    );

    const signature = await window.crypto.subtle.sign(
        algorithm,
        cryptoKey,
        msg
    );

    const hash = new Uint8Array(signature);

    const offset = hash[hash.length - 1] & 0xF;

    const bin = ((hash[offset] & 0x7F) << 24)
               | (hash[offset + 1] << 16)
               | (hash[offset + 2] << 8)
               | (hash[offset + 3]);

    const otp = `${bin}`.padStart(totpLength, "0").slice(-totpLength);

    return otp;
}

function getTotpWithForm(): void {
    errMsg("");
    infoMsg("Form");

    try {

        const req: TotpRequest = {
            tokenType: getStr("token_type"),
            secretToken: getStr("secret_token"),
            timeSteps: getInt("time_steps"),
            initialTime: getInt("initial_unix_epoch"),
            totpLength: getInt("totp_length"),
            hashKind: getStr("hash"),
            useSpecialTime: isChecked("use_special_time"),
            specialTime: getInt("special_time")
        };

        generateTotp(req)
        .then( otp => {
            document.getElementById("totp")!.textContent = otp;
        })
        .catch( (err: any) => {
            errMsg(err);
        });

    } catch (err) {
        errMsg(err);
    }
}

function getTotpFromUri(uri: string): void {
    errMsg("");
    infoMsg("Paste URI otpauth");

    try {
        const u = new URL(uri.replace("otpauth:", "https:"));
        const params = u.searchParams;

        const req: TotpRequest = {
            tokenType: "base64",
            secretToken: params.get("secret") ?? "",
            timeSteps: toInt(params.get("period") ?? "30"),
            initialTime: 0,
            totpLength: toInt(params.get("digits") ?? "6"),
            hashKind: (params.get("algorithm") ?? "SHA1").replace("SHA", "SHA-"),
            useSpecialTime: false,
            specialTime: 0
        };

        const label = decodeURI(u.pathname).slice(1);
        const issuer = params.get("issuer") ?? "";

        generateTotp(req)
        .then( otp => {
            document.getElementById("totp")!.textContent = otp;
            infoMsg(`URI: LABEL: ${label}, ISSUER: ${issuer}`);
            if (addToTotpUriList(uri)) {
                showTotpUriList(label);
            }
        })
        .catch( (err: any) => {
            errMsg(err);
        });

    } catch (err) {
        errMsg(err);
    }
}

function pasteUri(e: Event): void {
    if (!(e instanceof ClipboardEvent)) {
        return;
    }
    try {
        const clipboardData = (e as ClipboardEvent).clipboardData;
        if (clipboardData === null) {
            return;
        }
        for (const item of clipboardData.items) {
            if (item.kind !== "string") { continue; }
            item.getAsString( s => {
                if (s.match(/^otpauth:\/\/totp\//)) {
                    getTotpFromUri(s);
                }
            });
            return;
        }
    } catch (err) {
        errMsg(err);
    }
}

function getBySavedUri(): void {
    errMsg("");
    const label = getStr("saved");
    for (const item of getTotpUriList()) {
        if (item.label === label) {
            getTotpFromUri(item.uri);
            return;
        }
    }
}

function deleteSavedUri(): void {
    errMsg("");
    const label = getStr("saved");
    if (deleteFromTotpUriList(label)) {
        showTotpUriList();
    }
}

function showSavedUri(): void {
    errMsg("");
    const label = getStr("saved");
    for (const item of getTotpUriList()) {
        if (item.label === label) {
            errMsg(item.uri);
            return;
        }
    }
}

document.addEventListener("paste", pasteUri);
document.getElementById("get")!.addEventListener("click", () => getTotpWithForm());
document.getElementById("getBySavedUri")!.addEventListener("click", () => getBySavedUri());
document.getElementById("deleteSavedUri")!.addEventListener("click", () => deleteSavedUri());
document.getElementById("showSavedUri")!.addEventListener("click", () => showSavedUri());

showTotpUriList();
