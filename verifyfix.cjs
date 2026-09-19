const { spawn } = require("child_process");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9228;
const app = spawn(CHROME,[`--remote-debugging-port=${PORT}`,"--headless=new","--disable-gpu","--no-sandbox","about:blank"]);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function cdp(ws,id,method,params={}){return new Promise((res,rej)=>{const h=e=>{const m=JSON.parse(e.data);if(m.id===id){ws.removeEventListener("message",h);m.error?rej(new Error(JSON.stringify(m.error))):res(m);}};ws.addEventListener("message",h);ws.send(JSON.stringify({id,method,params}));});}
const TOKEN=process.env.TOKEN, U=process.env.USERJSON;
(async()=>{
  await sleep(2500);
  const r0=await fetch(`http://localhost:${PORT}/json/new?http://localhost:5173/login`,{method:"PUT"});
  const tab=await r0.json();
  const ws=new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise(r=>ws.addEventListener("open",r));
  await cdp(ws,1,"Page.enable"); await cdp(ws,2,"Runtime.enable");
  const errs=[];
  ws.addEventListener("message",e=>{const m=JSON.parse(e.data);if(m.method==="Runtime.exceptionThrown")errs.push("EXC:"+JSON.stringify(m.params.exceptionDetails?.text));if(m.method==="Runtime.consoleAPICalled"&&m.params.type==="error")errs.push("CONSOLE-ERR:"+JSON.stringify(m.params.args));});
  await sleep(4000);
  await cdp(ws,3,"Runtime.evaluate",{expression:`localStorage.setItem('token',${JSON.stringify(TOKEN)});localStorage.setItem('user',${JSON.stringify(U)});location.href='http://localhost:5173/admin/orders';`});
  await sleep(6000);
  const nav=async(href,label)=>{await cdp(ws,99,"Runtime.evaluate",{expression:`[...document.querySelectorAll('a')].find(a=>a.getAttribute('href')==='${href}').click()`});await sleep(4000);const v=await cdp(ws,100,"Runtime.evaluate",{expression:`({url:location.href,text:document.getElementById('root').innerText.slice(0,120)})`,returnByValue:true});console.log(label,"->",v.result.result.value.url, JSON.stringify(v.result.result.value.text));};
  await nav("/admin/customers","click Customers");
  await nav("/admin","click Dashboard");
  await nav("/admin/orders","click Orders");
  await nav("/admin/products","click Products");
  console.log("=== ERRORS ==="); errs.length?errs.forEach(e=>console.log(e)):console.log("(none)");
  ws.close(); app.kill(); process.exit(0);
})().catch(e=>{console.error("ERR",e);try{app.kill()}catch{};process.exit(1);});
