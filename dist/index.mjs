import t from"express";import{createServer as n}from"http";var e=t(),s=n(e),o=3e3;e.get("/",(p,r)=>{r.send("Hello World!")});s.listen(o,()=>{console.log(`Ta funfando na porta ${o}`)});
