export function formatDate(DateString) {

  const date = new Date(DateString);

   const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
   const day = date.getDate().toString().padStart(2,"0");
   const month = monthNames[date.getMonth()].toString().slice(0,3);
   const year = date.getFullYear();

  return `${day}-${month}-${year}`;  
}
