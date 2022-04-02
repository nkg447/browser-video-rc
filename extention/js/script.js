const SERVER_BASE = "http://[2405:201:681a:492c:f898:a6cd:654d:4ce4]:4001";
const JOIN_CODE = getRandomJoinCode();
init();

function init() {
  doOnCurrentTab((tab) => {
    if (localStorage.getItem(`document-${tab.id}`) != null) {
      document.body.innerHTML = localStorage.getItem(`document-${tab.id}`);
      setPopupUI();
    }
  });

  chrome.storage.sync.get("id").then(({ id }) => {
    showQR(id);
    const a = document.getElementById("website");
    a.innerText = SERVER_BASE;
    a.href = SERVER_BASE;
  });

  document.getElementById("enable-btn").onclick = () => {
    document.querySelector("#enable-btn > img").src =
      "./images/icon/on-button.png";
    document.querySelector("#enable-btn > #status").innerHTML = "Enabled";
    document.getElementById("connect-info").style.display = "unset";
    setPopupUI();
    doOnCurrentTab((tab) => {
      localStorage.setItem(`document-${tab.id}`, document.body.innerHTML);
    });
  };

  localStorageCleanup();
}

function setPopupUI() {
  chrome.storage.sync.get("id").then(({ id }) => {
    run();
    document.getElementById("join-code").innerText = JOIN_CODE;
    document.getElementById("connect-info").style.display = "unset";
    setTimeout(() => sendId(id), 1000);
  });
}

function sendId(id) {
  doOnCurrentTab((tab) => {
    chrome.tabs.sendMessage(
      tab.id,
      { id: id, joinCode: JOIN_CODE },
      function (response) {
        console.log(response);
      }
    );
  });
}

function run() {
  doOnCurrentTab((tab) => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["./js/external/socket.io.js", "./js/common.js"],
    });
  });
}

function showQR(value) {
  const link = SERVER_BASE + "?id=" + value;
  var qr = new QRious({
    element: document.getElementById("qr"),
    size: 150,
    value: link,
    background: "#",
    foreground: "white",
  });
  const a = document.getElementById("qr-link");
  a.innerText = link;
  a.href = link;
}

function getRandomJoinCode() {
  var randomPool = new Uint8Array(2);
  crypto.getRandomValues(randomPool);
  let hex = "";
  for (var i = 0; i < randomPool.length; ++i) {
    hex += randomPool[i].toString(16);
  }
  if (hex.length < 4) hex = "0" + hex;
  return hex;
}

function doOnCurrentTab(callback) {
  chrome.tabs
    .query({
      active: true,
      currentWindow: true,
    })
    .then((tabs) => {
      callback(tabs[0]);
    });
}

function localStorageCleanup() {
  const keys = Object.keys(localStorage);
  const toKeep = [];
  chrome.tabs.query({}).then((tabs) => {
    tabs
      .map((e) => e.id)
      .forEach((e) => {
        toKeep.push(`document-${e}`);
      });
    keys.forEach((e) => {
      if (!toKeep.includes(e)) {
        localStorage.removeItem(e);
      }
    });
  });
}