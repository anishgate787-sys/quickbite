export function foodImage(name:string){
  const query=name.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().replace(/ /g,',');
  const lock=[...name].reduce((sum,char)=>sum+char.charCodeAt(0),0);
  return `https://loremflickr.com/900/600/${query},food?lock=${lock}`;
}
