// *****************************************************
// MND <= Proxy
window.mnd??=function(){let c={get(a,b){return a[b]??=new Proxy({},c)}};return new Proxy({},c)}();


// *****************************************************
// Toast <= Function
function toast(msg) {
  if(!toast.node) {
    let node = document.createElement('div')
    node.attachShadow({mode:'open'}).innerHTML = '<style type="text/css">:host{position:fixed;inset:auto 0 16px 0;display:flex;justify-content:center;z-index:100001;}:host::before{content:attr(data-msg);padding:.5em 1em;border-radius:1.5em;background:#777;color:#fff;animation:_hi 3s;opacity:0;}@keyframes _hi{0%{opacity:0;}10%{opacity:1;}60%{opacity:1;}100%{opacity:0;}}</style>';
    toast.node = node; toast.list = []; toast.free = 1;
  }
  toast.list.unshift(msg);
  if(toast.free) view()
  function view() {
    toast.free = 0;toast.node.dataset.msg = toast.list.pop()
    document.documentElement.appendChild(toast.node)
    setTimeout(() => (toast.list.length) ? view() : (toast.node.remove(),toast.free = 1), 2800);
  }
}


// *****************************************************
// __JsInterface <= Proxy
window.__JsInterface ??= new Proxy({
  readFile(id, fileName) {__JsResponses(id,localStorage.getItem(fileName))},
  writeFile(fileName, content) {localStorage.setItem(fileName, content)},
  toast(msg) {toast(msg)}
},{get(a,b){return a[b] ?? function(){}}});


// *****************************************************
// mnd.frames.jsi >= JsInterface, JsResponses
!function () {
  const __JsInterface = window.__JsInterface;
  const ResponsesPending = new Object;
  let UUID = 0x1;
  
  const suscribe = () => {
    const id = (UUID++).toString(16);
    const promise = new Promise(res => ResponsesPending[id] = res);
    return {id, promise};
  }
  
  mnd.frames.jsi.JsInterface = new Proxy(__JsInterface, {
    get(Jsi, key) {
      const object = {toast, shareText, readFile, writeFile};
      if(typeof object[key] == 'function') return object[key].bind(object);
      if(typeof Jsi[key] == 'function') return Jsi[key].bind(Jsi);
      return Jsi[key];
    }
  });
  
  window.__JsResponses =
  mnd.frames.jsi.JsResponses = (function (callback_id, ...args) {
    const fn = ResponsesPending[callback_id];
    if(typeof fn == 'function') fn(...args);
  });
  
  window.__JsEvent = function(event) {
    if(typeof mnd.frames.jsi.JsEvent == 'function') mnd.frames.jsi.JsEvent(event)
  }
  
  function toast(str = '') {
    __JsInterface.toast(str);
  }
  function shareText(str = '') {
    __JsInterface.shareText(str);
  }
  function readFile(fileName = 'file_default') {
    const subscription = suscribe();
    __JsInterface.readFile(subscription.id, fileName);
    return subscription.promise;
  }
  function writeFile(fileName = 'file_default', content = null) {
    __JsInterface.writeFile(fileName, content);
  }
}();


// *****************************************************
// mnd.frames.util >= encode, decode
!function (){
  async function encode(str) {
    if(typeof str != 'string' || !str) return '';
    let reader = new FileReader();
    reader.readAsDataURL( new Blob([str], {type: 'text/plain'}) );
    return new Promise(res => reader.onload = () => res(reader.result));
  }
  async function decode(str) {
    if(typeof str != 'string' || !str) return '';
    return fetch(str).then(e => e.text());
  }
  
  mnd.frames.util.encode = encode;
  mnd.frames.util.decode = decode;
}();



// *****************************************************
// mnd.frames.util >= tag
!function () {
  function tag(tagName, clases, attrs) {
    const node = document.createElement(tagName || 'div');
    node.classList.value = (clases || '');
    Object.entries(attrs || {}).forEach(attr => node.setAttribute(...attr));
    
    return function (...args) {
      args.forEach(arg => {
          if(typeof arg == 'string')
            node.innerText = arg;
          if(typeof arg == 'function')
            arg(node);
          if(typeof arg == 'object' && arg != null)
            if(arg instanceof Element) node.appendChild(arg);
            else addEventListeners(node, arg)
      });
      return node;
    }
  }
  
  function addEventListeners(node, args) {
    Object.entries(args).forEach(([event, fn]) => {
      node.addEventListener(event, fn);
    })
  }
  
  mnd.frames.util.tag = tag;
}();


// *****************************************************
// mnd.frames.data >= Mapa
!function () {
  class Mapa {
    constructor(json_in) {
      this.data = JSON.parse(json_in || '{"UUID":0,"HEAD":{"ID":"HEAD"}}')
    }
    fill(json_in) {
      this.data = JSON.parse(json_in || '{"UUID":0,"HEAD":{"ID":"HEAD"}}')
    }
    push(OBJECT = {}) {
      let ID = 'NODE_'.concat(++this.data.UUID);
      let NODE = this.data.HEAD;
      while(NODE.after) NODE = this.data[NODE.after];
      NODE.after = ID;
      return this.data[ID] = {before: NODE.ID, ID, OBJECT}
    }
    remove(ID) {
      if(!this.data[ID]) return null
      let NODE = this.data[ID]
      this.data[NODE.before].after = NODE.after;
      if(NODE.after)
      this.data[NODE.after].before = NODE.before;
      delete this.data[ID]
      return NODE
    }
    getArray(filter) {
      let lista = []
      let NODE = this.data.HEAD
      while(NODE.after) lista.push(NODE = this.data[NODE.after])
      if(filter) return lista.filter(filter)
            else return lista
    }
    toJsonString() {
      return JSON.stringify(this.data)
    }
    has(ID) {
      return (ID in this.data);
    }
    getItem(ID) {
      return this.data[ID] ?? null;
    }
  }
  
  mnd.frames.data.Mapa = Mapa;
}();