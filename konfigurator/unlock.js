const form=document.getElementById('access'),error=document.getElementById('error');
const bytes=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
form.addEventListener('submit',async event=>{
 event.preventDefault();const button=form.querySelector('button');button.disabled=true;error.textContent='';
 try{
  const response=await fetch('protected-page.json?v=20261001',{cache:'no-store'});if(!response.ok)throw new Error('network');const p=await response.json();
  const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(form.password.value),'PBKDF2',false,['deriveKey']);
  const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:bytes(p.salt),iterations:p.iterations,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['decrypt']);
  const plaintext=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(p.iv)},key,bytes(p.ciphertext));
  form.password.value='';document.open();document.write(new TextDecoder().decode(plaintext));document.close();
 }catch(e){error.textContent=e.name==='OperationError'?'Nieprawidłowe hasło.':'Nie udało się otworzyć konfiguratora. Spróbuj ponownie.';button.disabled=false;form.password.focus();}
});
