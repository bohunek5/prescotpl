// Inline vectors keep controls consistent across browsers, including iOS emoji fonts.
const paths={
  external:'<path d="M7 17 17 7M7 7h10v10"/>',
  export:'<path d="M12 3v12m-5-5 5 5 5-5M5 16v4h14v-4"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.1"/>',
  play:'<path d="m8 5 11 7-11 7Z"/>',
  pause:'<path d="M9 5v14M15 5v14"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  moon:'<path d="M20.5 13.1A8.7 8.7 0 0 1 10.9 3.5a8.7 8.7 0 1 0 9.6 9.6Z"/>',
  reset:'<path d="M4 10a8 8 0 1 1 1.8 8M4 4v6h6"/>',
  left:'<path d="m10 5-7 7 7 7M3 12h18"/>',
  right:'<path d="m14 5 7 7-7 7M3 12h18"/>',
};
export function uiIcon(name){
  return `<svg class="ui-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${paths[name]}</svg>`;
}
export function actionLabel(element,label,icon){
  const text=document.createElement('span');text.textContent=label;
  element.replaceChildren(text);element.insertAdjacentHTML('beforeend',uiIcon(icon));
}
