// version: 2.0
!function () {
  let consoleVisible = false;
  const Link = Symbol();


// Console *********************************************
  const Icono = tag('','',['style','margin: auto;font-weight: 900;background-color: #000;color: #fff;padding: 0 2.5px 1px;border-radius: 4px;font-size: 14px;font-family: Arial;'])('>_');
  const Floating = tag('','',['style','display: flex;position: fixed;top: 0;left: 0;height: 30px;width: 30px;background-color: #fff;opacity: .5;transform-origin: center;border-radius: 50%;box-shadow: -2px 2px 8px rgba(0,0,0,.4);transform:translate(calc(100vw - 120%), 50vw);'])(Icono, _this => {
    _this.style.zIndex = 100001;
    _this.addEventListener('touchstart', TouchStart);
    _this.addEventListener('click', () => (consoleVisible) ? hideConsole() : showConsole() );
  });
  const Input = tag('textarea','',['id','C_Input'])(_this => {
    _this.addEventListener('keydown', inputCode);
  });
  const InputContainer = tag('label','',['id','C_InputContainer'],['for','C_Input'])(Input);
  const Console = tag('section','',['id','C_Console'],['title','Consola'])(InputContainer, _this => {
    _this.addEventListener('click', clickConsole);
  });
  const Style = tag('style','',['type','text/css'])(cssText());
  const Page = tag('','',['style','position: absolute;top: 0;left: 0;'])(_this => {
    _this.style.zIndex = 100000;
    _this.attachShadow({mode:'open'});
    _this.shadowRoot.appendChild(Style);
    _this.shadowRoot.appendChild(Console);
  });
  registreConsole();
  // document.documentElement.append(Floating);


// Funciones Principales *******************************
  function showConsole() {
    document.documentElement.appendChild(Page);
    consoleVisible = true;
  }
  function hideConsole() {
    Page.remove();
    consoleVisible = false;
  }
  function TouchStart() {
    document.addEventListener('touchmove', TouchMove);
    document.ontouchend = function() {
      document.removeEventListener('touchmove', TouchMove);
      document.ontouchend = null;
    }
  }
  function TouchMove (e) {
    let {touches:[{clientX, clientY}]} = e;
    Floating.style.transform = 'translate('+( clientX - 15 )+'px, '+( clientY - 15 )+'px)';
  }


// Funciones Principales *******************************
  function clickConsole(e) {
    let code = e.target.closest('.code')
    if(code) Input.value = code.dataset.code;
    let drop = e.target.closest('.drop')
    if(drop) toggleGroup(drop);
  }
  function inputCode(e) {
    if(e.key !== 'Enter') return;
    const regex = /[\[|{\(\)\}\]]/g;
    const code = Input.value.trim();
    const isOdd = (code.length - code.replace(regex, '').length) % 2;
    if (!code || isOdd) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    Input.value = '';
    insertBefore( tagMessageCode(code) );
    let res = execute(code);
    if(res.type == 'error') error(res.value);
    else log(res.value);
  }
  function toggleGroup(target) {
    target.classList.toggle('show')
    let group = target.parentElement.querySelector('.group')
    if(target.classList.contains('show')) fillGroup(group, target[Link]);
    else group.innerHTML = '';
  }
  function fillGroup(group, object){
    const props = [];
    for (let key in object) {
      props.push(key);
    }
    props.push(...[
      ...Object.keys(object),
      ...Object.getOwnPropertyNames(object),
      ...Object.keys(object['__proto__'] || {}),
      ...Reflect.ownKeys(object),
      '__proto__','prototype'
    ])
    ;[...new Set(props)]
    .filter(key => key in object)
    .forEach( key => group.appendChild(tagLine(key,object)) )
  }


// Funciones Principales *******************************
  function registreConsole() {
    const originalConsole = console;
    window.console = new Proxy( window.console ,{
      get(target, prop) {
        const fns = {log, error, clear, _show, _hide};
        if(prop in fns) return fns[prop];
        return target[prop];
      }
    });
    window.addEventListener('error', error);
  }
  function _show() {
    document.documentElement.append(Floating);
  }
  function _hide() {
    Floating.remove();
    hideConsole();
  }
  function error(error) {
    let text = 0;
    if(error instanceof Event) error = error.error;
    if(error instanceof Error) text = tagText(error.message || '');
    insertBefore( tagMessage('error', text, error) );
  }
  function log(...res) {
    insertBefore( tagMessage('log', 0, ...res) );
  }
  function clear() {
    Console.innerHTML = '';
    Console.appendChild(InputContainer);
  }
  function execute(code) {
    let type, value;
    try {
      value = (new Function('code','return window.eval(code)'))(code);
      type = 'log';
    }
    catch(err) {
      value = err;
      type = 'error';
    }
    return ({type, value});
  }
  function insertBefore(node) {
    Console.insertBefore( node, InputContainer );
  }
  function getInstance(obj){
    return obj?.constructor?.name ?? obj?.__proto__?.constructor?.name ?? 'Object'
  }
  function getPromiseStatus(obj) {
    let status = 'pending', value;
    let result = obj.then(
      (val) => {status = 'resolved';value = val;},
      (val) => {status = 'rejected';value = val;}
    );
    Object.defineProperties(result, {
      '[[PromiseStatus]]': {get: () => status},
      '[[PromiseValue]]': {get: () => value}
    });
    return result;
  }
  function escapeHTML(str) {
    if (typeof str !== 'string') return str;
    return tag('textarea')(_this => _this.textContent = str).innerHTML;
  }


// Funciones Tag **************************************
  function tagMessageCode(value) {
    let code = tag('','code')(value, _this => _this.dataset.code = value);
    let message = tag('','message _code')(code, tagInfo());
    return message
  }
  function tagMessage(level, node, ...args) {
    let texts = args.map(arg => tagText(arg));
    let message = tag('','message _'+level)(node,...texts, tagInfo());
    return message;
  }
  function tagText(value, key) {
    let content = [];
    // Array.prototype[Symbol.unscopables] instanceof Object
    if(typeof value === 'object' && value !== null || typeof value === 'function') {
      if (value instanceof Promise && !('[[PromiseStatus]]' in value))
        value = getPromiseStatus(value);
      content = [tag('span','drop')( getInstance(value), _this => _this[Link] = value ), tag('','group')()];
    }
    else
      content = [String(escapeHTML(value))];
    let text = tag('span','text _'+(typeof value))(...content)
    return text;
  }
  function tagKey(key) {
    return tag('span','key')(String(key) + ':')
  }
  function tagLine(key, _value) {
    let value; try { value = _value[key]} catch(e) {}
    return tag('','line')( tagKey(key), tagText(value) );
  }
  function tagInfo() {
    return tag('','info')(
      tag('span')( (new Date()).toLocaleString() ),
      tag('span')('console')
    );
  }


// Funciones Tag **************************************
  function tag(tagName, clases, ...attrs) {
    const Node = document.createElement(tagName || 'div');
    Node.classList.value = (clases || '');
    attrs.forEach(attr => Node.setAttribute(...attr));
    function Context(...args) {
      args.forEach(arg => {
        switch(typeof arg) {
          case 'string':
            Node.innerHTML = arg; break;
          case 'object':
            Node.appendChild(arg); break;
          case 'function':
            arg(Node); break;
        }
      })
      return Node;
    }
    return Context;
  }


// cssText ********************************************
  function cssText() {
    return `
      :host, * {
        margin:0;
        padding:0;
        box-sizing:border-box;
      }
      #C_Console {
        overflow-y: auto;
        position: fixed;
        top: 0;
        left: 0;
        height: 100vh;
        width: 100vw;
        background-color: #191924;
        color: #eeeeee;
        font-family: 'Roboto', sans-serif;
        animation: --page-transition .1s ease 1;
      }
      @keyframes --page-transition {
        0% {opacity: 0;transform: translate3d(0, 50%, 0)}
        100% {opacity: 1;transform: translate3d(0, 0, 0)}
      }
      #C_Console[title]{
        padding-top: 65px;
      }
      #C_Console[title]::before {
        content: attr(title);
        z-index: 1;
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        background-color: inherit;
        display: flex;
        height: 44px;
        align-items: center;
        justify-content: center;
        font-family: Verdana, Geneva, Tahoma, sans-serif;
        font-weight: 900;
        box-shadow: 0 2px 4px rgba(0, 0, 0, .2);
        color: #fff;
      }
      #C_InputContainer {
        display: flex;
        width: 100%;
        height: fit-content;
      }
      #C_InputContainer::before {
        content: '>>';
        margin: 0 5px;
        height: 100%;
      }
      #C_Input {
        color: #fff;
        caret-color: currentColor !important;
        position: relative;
        width: 100%;
        border: 2px solid transparent;
        background-color: transparent;
        overflow: scroll;
        resize: none;
        height: 16em;
      }
      #C_Input:focus {
        outline: none;
      }
      .message {
        position: relative;
        display: flex;
        border-bottom: solid 1px rgba(204, 204, 204, 0.4);
        margin-bottom: 35px;
        font-size: .9rem;
        flex-wrap: wrap;
      }
      .message._error {
        background-color: #422;
      }
      .code {
        position: relative;
        color: rgb(214, 211, 211);
        font-size: 1em;
        font-family: 'Courier New', Courier, monospace;
        overflow-x: auto;
        white-space: pre;
        
        max-width: calc(100% - 48px);
        overflow: hidden;
        text-overflow: ellipsis;
        padding-right: 4ch;
        white-space: nowrap;
      }
      .code::after {
        content: 'use';
        background-color: #666;
        color: inherit;
        border-radius: 4px;
        padding: 0 0.4rem;
        font-size: 0.6rem;
        
        position: absolute;
        right: 0;
        bottom: 2px;
      }
      .code::before {
        content: '>>';
        padding: 0 5px;
        font-style: italic;
      }
      
      
      .key {
        color: #cc66ff;
      }
      .info {
        font-family: Verdana, Geneva, Tahoma, sans-serif;
        position: absolute;
        top: 100%;
        right: 0;
        display: flex;
        height: 20px;
        align-items: center;
        justify-content: space-between;
        width: 100vw;
        background-color: inherit;
        padding: 0 5px;
        font-size: .8rem;
        color: inherit;
      }
      .text {
        padding: 2px;
        white-space: pre;
        font-family: Verdana, Geneva, Tahoma, sans-serif;
        overflow: auto;
        box-sizing: border-box;
        max-width: 100vw;
        font-size: 0.9rem;
        width: 100%;
        padding-left: 10px;
        white-space: break-spaces;
      }
      .text._function {
        font-family: 'Courier New', Courier, monospace;
        font-size: 0.9rem;
      }
      .text._function::before {
        content: '\u0192';
        margin: 0 2px;
        font-style: italic;
        color: #9999ff;
      }
      .text._string:not(.no-qoutes)::before {
        content: '\u0022';
        margin-right: 2px;
      }
      .text._string:not(.no-qoutes)::after {
        content: '\u0022';
        margin-left: 2px;
      }
      .text._bigint::after {
        content: 'n';
        font-style: italic;
      }
      .text._boolean {color: #8250b1;}
      .text._bigint {color: #6158dd;}
      .text._number {color: #6158dd;}
      .text._symbol {color: #6f59ac;}
      .text._function {color: #9188a8;}
      .text._object {color: #76a376;}
      .text._undefined {color: #76a376;}
      .text._string {color: #3ba13b;}
      .group {
        display: none;
        margin-left: 2ch;
      }
      .drop.show + .group {
        display: block;
      }
      .drop::before {
        display: inline-block;
        content: '\u25b8';
        margin-right: 2.5px;
      }
      .drop.show::before {
        content: '\u25be';
      }
      .drop::after {
        content: '{...}';
      }
      .drop.show::after {
        display: none;
      }
    `;
  }


}();