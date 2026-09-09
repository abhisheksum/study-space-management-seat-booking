'use strict';
const StudentAPI = (() => {
 const base = '/api'; const request = async (path, options={}) => {
   const response = await fetch(base+path, { ...options, headers: {'Content-Type':'application/json', ...(options.headers||{}), ...(localStorage.studentToken?{Authorization:'Bearer '+localStorage.studentToken}:{}) }});
   const body = await response.json().catch(()=>({message:'Request failed'}));
   if (!response.ok) { const error=new Error(body.message||'Request failed'); error.status=response.status; throw error; } return body.data;
 };
 return { async login(login,password) { const data=await request('/student-auth/login',{method:'POST',body:JSON.stringify({login,password})}); localStorage.studentToken=data.token; localStorage.student=data.student; return data; },
   dashboard:()=>request('/student/dashboard'),
   seats:(date,slot)=>request(`/student/seats/availability?date=${encodeURIComponent(date)}&slot=${encodeURIComponent(slot)}`),
   createBooking: booking => request('/student/bookings',{method:'POST',body:JSON.stringify(booking)}),
   cancelBooking: id => request(`/student/bookings/${encodeURIComponent(id)}/cancel`,{method:'PATCH'}),
   updateProfile: profile => request('/student/profile',{method:'PATCH',body:JSON.stringify(profile)}),
   logout:()=>localStorage.removeItem('studentToken') };
})();
