/**
 * スポット一覧を表示します。すでに表示している場合は地図表示に戻ります。
 */
const toggleSpotList = () => {
  const mapElm = document.getElementById("map");
  const spotList = document.getElementById("spot-list");
  if (spotList.style.display === "block") {
    spotList.style.display = "none";
    if (mapElm.style.display === "none") {
      mapElm.style.display = "block";
    }
  } else {
    const nonMapScreens = document.getElementsByClassName("non-map-screen");
    for (const nonMapScreen of nonMapScreens) {
      nonMapScreen.style.display = nonMapScreen.id === "spot-list" ? "block" : "none";
    }
    mapElm.style.display = "none";
  }
  if (spotList.style.display === "block") {
    const zoomInMessage = document.getElementById("zoom-in-message");
    if (zoomInMessage) {
      zoomInMessage.style.display = "none";
    }
  }
};

/**
 * 種別のタイトルにジャンプするアイコンを構築します。
 *
 * @param id id属性のサフィックス
 * @param iconTypes アイコン定義のマップ
 * @return {HTMLAnchorElement} aタグ
 */
const createJumpIcon = (id, iconTypes) => {
  const iconType = iconTypes.get(id);
  const jumpIcon = document.createElement("a");
  jumpIcon.href = `#spot-link-${id}`;
  jumpIcon.innerHTML = `<i class="fa-solid ${iconType.icon}" style="color: ${iconType.color}"></i>`;
  return jumpIcon;
};

/**
 * 表を生成します。
 *
 * @param spots スポット一覧
 * @param name 名前
 * @param parent 追加対象の要素
 * @param iconTypes アイコン定義のマップ
 * @param id ジャンプ先に設定するid属性
 */
const buildTable = (spots, name, parent, iconTypes, id = "default") => {
  const title = document.createElement("h2");
  title.innerText = name;
  title.id = `spot-link-${id}`;
  parent.appendChild(title);
  const table = document.createElement("table");
  spots.forEach((spot) => {
    const tr = document.createElement("tr");
    const td1 = document.createElement("td");
    td1.style.width = "200px";
    const iconType = iconTypes.get(spot.icon);
    td1.innerHTML = `<i class="fa-solid ${iconType.icon}" style="color: ${iconType.color}"></i> `;
    td1.innerHTML += `<a href="?lat=${spot.coordinate[0]}&lng=${spot.coordinate[1]}&z=17">${spot.name}</a><br/>`;
    if (spot.kana) {
      td1.innerHTML += `${spot.kana}<br/>`;
    }
    if (spot.pictures) {
      const pic = spot.pictures[0];
      td1.innerHTML += `<img src="${pic.url}" alt="${pic.comment}" width="200px"/><br/>`;
      if (spot.pictures.length > 1) {
        td1.innerHTML += `<div class="other-pics">(他${spot.pictures.length - 1}枚)</div>`;
      }
    }
    tr.appendChild(td1);
    const td2 = document.createElement("td");
    td2.innerHTML = spot.description ?? "(未記入)";
    tr.appendChild(td2);
    table.appendChild(tr);
  });
  parent.appendChild(table);
};

/**
 * マップに戻るボタンを生成します。
 *
 * @param mt {number} margin-top
 * @param mb {number} margin-bottom
 * @return {HTMLButtonElement} マップに戻るボタン
 */
const createBackToMapButton = (mt = 0, mb = 0) => {
  const backToMap = document.createElement("button");
  backToMap.innerHTML = "<i class='fa-solid fa-circle-arrow-left'></i> 地図に戻る";
  backToMap.style.marginTop = `${mt}px`;
  backToMap.style.marginBottom = `${mb}px`;
  backToMap.addEventListener("click", toggleSpotList);
  return backToMap;
};

/**
 * トップに戻るボタンを生成します。
 *
 * @param ml {number} margin-left
 * @return {HTMLButtonElement} トップに戻るボタン
 */
const createBackToTopButton = (ml = 5) => {
  const backToTop = document.createElement("button");
  backToTop.innerHTML = "<i class='fa-solid fa-circle-arrow-up'></i> 先頭に戻る";
  backToTop.style.marginLeft = `${ml}px`;
  backToTop.addEventListener("click", () => window.scrollTo(0, 0));
  return backToTop;
};

/**
 * スポット一覧ページを初期化します。
 *
 * @param spots スポット一覧
 * @param iconTypes アイコン定義
 */
const initSpotList = (spots, iconTypes) => {
  const buttonOpenSpotList = document.getElementById("spot-list-open");
  const spotList = document.getElementById("spot-list");
  buttonOpenSpotList.addEventListener("click", toggleSpotList);
  const btm1 = createBackToMapButton(0, 10);
  spotList.appendChild(btm1);
  const iconPane = document.createElement("div");
  iconPane.className = "spot-link-icons";
  const passList = [],
    honjinList = [],
    ichirizukaList = [],
    sekishoList = [],
    watashiList = [],
    bridgeList = [],
    kosatsubaList = [],
    shrineList = [],
    templeList = [],
    monumentList = [],
    buildingList = [],
    otherList = [];
  spots.forEach((spot) => {
    switch (spot.icon) {
      case "pass":
        passList.push(spot);
        break;
      case "honjin":
        honjinList.push(spot);
        break;
      case "ichirizuka":
        ichirizukaList.push(spot);
        break;
      case "sekisho":
        sekishoList.push(spot);
        break;
      case "watashi":
        watashiList.push(spot);
        break;
      case "bridge":
        bridgeList.push(spot);
        break;
      case "kosatsuba":
        kosatsubaList.push(spot);
        break;
      case "shrine":
        shrineList.push(spot);
        break;
      case "temple":
        templeList.push(spot);
        break;
      case "monument":
        monumentList.push(spot);
        break;
      case "building":
        buildingList.push(spot);
        break;
      default:
        otherList.push(spot);
        break;
    }
  });
  spotList.appendChild(iconPane);
  const buildIconSection = (id, name, list) => {
    if (list.length === 0) {
      return;
    }
    iconPane.appendChild(createJumpIcon(id, iconTypes));
    buildTable(list, name, spotList, iconTypes, id);
    const btm = createBackToMapButton(10, 0);
    spotList.appendChild(btm);
    const btt = createBackToTopButton();
    spotList.appendChild(btt);
  };
  buildIconSection("pass", "峠", passList);
  buildIconSection("honjin", "本陣", honjinList);
  buildIconSection("ichirizuka", "一里塚", ichirizukaList);
  buildIconSection("sekisho", "関所", sekishoList);
  buildIconSection("watashi", "渡場", watashiList);
  buildIconSection("bridge", "橋", bridgeList);
  buildIconSection("kosatsuba", "高札場", kosatsubaList);
  buildIconSection("shrine", "神社", shrineList);
  buildIconSection("temple", "寺", templeList);
  buildIconSection("monument", "道標・記念碑・石仏・石塔・常夜燈等", monumentList);
  buildIconSection("building", "建造物", buildingList);
  buildIconSection("default", "その他", otherList);
  const picCount = spots
    .map((spot) => (spot.pictures ? spot.pictures.length : 0))
    .reduce((acc, v) => acc + v, 0);
  const counter = document.createElement("p");
  counter.innerHTML = `全 ${spots.length} 地点 (写真 ${picCount} 枚)`;
  spotList.appendChild(counter);
  const q = new URLSearchParams(location.search);
  if (q.get("landing") === "spots") {
    toggleSpotList();
  }
};
