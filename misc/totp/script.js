"use strict";
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
function toInt(s) {
    const n = parseInt(s);
    return isNaN(n) ? 0 : n;
}
function nowUnixEpoch() {
    return Math.floor(Date.now() / 1000);
}
function toBytes(s) {
    if (s.length % 2 === 1) {
        s = "0" + s;
    }
    const buf = new ArrayBuffer(Math.floor(s.length / 2));
    const arr = new Uint8Array(buf);
    for (let i = 0; i < arr.length; i++) {
        arr[i] = parseInt(s.slice(i * 2, i * 2 + 2), 16);
    }
    return buf;
}
function fromBase32(s) {
    const sz = Math.floor((s.length * 5 + 7) / 8);
    const ret = new Uint8Array(sz);
    let bit = 0;
    let cnt = 0;
    let pos = 0;
    for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        if ("A" <= ch && ch <= "Z") {
            bit = (bit << 5) | ((ch.charCodeAt(0) - "A".charCodeAt(0)) & 31);
        }
        else if ("2" <= ch && ch <= "7") {
            bit = (bit << 5) | ((ch.charCodeAt(0) - "2".charCodeAt(0) + 26) & 31);
        }
        else {
            bit = bit << 5;
        }
        cnt += 5;
        if (cnt >= 8) {
            ret[pos] = (bit >> (cnt - 8)) & 0xFF;
            bit = bit & ((1 << (cnt - 8)) - 1);
            cnt -= 8;
            pos++;
        }
    }
    return ret.buffer;
}
function errMsg(err) {
    const msg = `${err}`;
    document.getElementById("err").textContent = msg;
    if (err !== "") {
        console.log(err);
    }
}
function infoMsg(msg) {
    document.getElementById("info").textContent = msg;
}
function isChecked(id) {
    const elem = document.getElementById(id);
    if (elem !== null) {
        if (elem instanceof HTMLInputElement) {
            return elem.checked;
        }
    }
    return false;
}
function getStr(id) {
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
function getInt(id) {
    return toInt(getStr(id));
}
function setValue(id, value) {
    const elem = document.getElementById(id);
    if (elem !== null) {
        if (elem instanceof HTMLInputElement) {
            elem.value = value;
        }
        else if (elem instanceof HTMLSelectElement) {
            elem.value = value;
        }
    }
}
const LOCAL_STORAGE_PATH = "neetsdkasuTOTP";
function disabledTotpUriListService() {
    document.getElementById("description").classList.add("silver");
    document.getElementById("saved").disabled = true;
    document.getElementById("getBySavedUri").disabled = true;
    document.getElementById("deleteSavedUri").disabled = true;
    document.getElementById("showSavedUri").disabled = true;
}
function getTotpUriList() {
    try {
        const json = window.localStorage.getItem(LOCAL_STORAGE_PATH);
        if (json === null) {
            return [];
        }
        return JSON.parse(json);
    }
    catch (err) {
        disabledTotpUriListService();
        return [];
    }
}
function addToTotpUriList(uri) {
    const u = new URL(uri.replace("otpauth:", "https:"));
    const newItem = {
        label: decodeURI(u.pathname).slice(1),
        datetime: Date.now(),
        uri: uri
    };
    const list = getTotpUriList();
    const exists = list.findIndex(e => e.label === newItem.label);
    if (exists < 0) {
        list.push(newItem);
    }
    else {
        list[exists] = newItem;
    }
    try {
        const json = JSON.stringify(list);
        window.localStorage.setItem(LOCAL_STORAGE_PATH, json);
        return true;
    }
    catch (err) {
        return false;
    }
}
function deleteFromTotpUriList(label) {
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
    }
    catch (err) {
        return false;
    }
}
function showTotpUriList(label) {
    const elem = document.getElementById("saved");
    elem.innerHTML = "";
    for (const item of getTotpUriList()) {
        const option = elem.appendChild(document.createElement("option"));
        option.value = item.label;
        option.textContent = item.label;
        option.selected = item.label === label;
    }
}
async function generateTotp(req) {
    if (!window.isSecureContext) {
        throw "REQUIRE SECURE CONTEXT";
    }
    const time = req.useSpecialTime ? req.specialTime : nowUnixEpoch();
    const T = Math.floor((time - req.initialTime) / req.timeSteps);
    const msg = toBytes(BigInt(T).toString(16).padStart(16, "0"));
    const key = (req.tokenType === "base32") ? fromBase32(req.secretToken) : toBytes(req.secretToken);
    const algorithm = {
        name: "HMAC",
        hash: req.hashKind
    };
    const totpLength = req.totpLength;
    const cryptoKey = await window.crypto.subtle.importKey("raw", key, algorithm, false, ["sign"]);
    const signature = await window.crypto.subtle.sign(algorithm, cryptoKey, msg);
    const hash = new Uint8Array(signature);
    const offset = hash[hash.length - 1] & 0xF;
    const bin = ((hash[offset] & 0x7F) << 24)
        | (hash[offset + 1] << 16)
        | (hash[offset + 2] << 8)
        | (hash[offset + 3]);
    const otp = `${bin}`.padStart(totpLength, "0").slice(-totpLength);
    return otp;
}
function getTotpWithForm() {
    errMsg("");
    infoMsg("Form");
    try {
        const req = {
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
            .then(otp => {
            document.getElementById("totp").textContent = otp;
        })
            .catch((err) => {
            errMsg(err);
        });
    }
    catch (err) {
        errMsg(err);
    }
}
function getTotpFromUri(uri) {
    errMsg("");
    infoMsg("Paste URI otpauth");
    try {
        const u = new URL(uri.replace("otpauth:", "https:"));
        const params = u.searchParams;
        const req = {
            tokenType: "base32",
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
            .then(otp => {
            document.getElementById("totp").textContent = otp;
            infoMsg(`URI: LABEL: ${label}, ISSUER: ${issuer}`);
            if (addToTotpUriList(uri)) {
                showTotpUriList(label);
            }
        })
            .catch((err) => {
            errMsg(err);
        });
    }
    catch (err) {
        errMsg(err);
    }
}
function pasteUri(e) {
    if (!(e instanceof ClipboardEvent)) {
        return;
    }
    try {
        const clipboardData = e.clipboardData;
        if (clipboardData === null) {
            return;
        }
        for (const item of clipboardData.items) {
            if (item.kind !== "string") {
                continue;
            }
            item.getAsString(s => {
                if (s.match(/^otpauth:\/\/totp\//)) {
                    getTotpFromUri(s);
                }
            });
            return;
        }
    }
    catch (err) {
        errMsg(err);
    }
}
function getBySavedUri() {
    errMsg("");
    const label = getStr("saved");
    for (const item of getTotpUriList()) {
        if (item.label === label) {
            getTotpFromUri(item.uri);
            return;
        }
    }
}
function deleteSavedUri() {
    errMsg("");
    const label = getStr("saved");
    if (deleteFromTotpUriList(label)) {
        showTotpUriList();
    }
}
function showSavedUri() {
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
document.getElementById("get").addEventListener("click", () => getTotpWithForm());
document.getElementById("getBySavedUri").addEventListener("click", () => getBySavedUri());
document.getElementById("deleteSavedUri").addEventListener("click", () => deleteSavedUri());
document.getElementById("showSavedUri").addEventListener("click", () => showSavedUri());
showTotpUriList();
