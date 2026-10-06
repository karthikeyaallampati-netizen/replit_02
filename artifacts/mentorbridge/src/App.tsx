import { type ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Link, Route, Router as WouterRouter, Switch, useLocation, useParams } from 'wouter';
import { ArrowRight, ArrowUpRight, BadgeCheck, CalendarDays, Check, ChevronRight, CircleHelp, Clock3, Compass, CreditCard, FileText, Filter, GraduationCap, HeartHandshake, MapPin, MessageCircle, Search, ShieldCheck, Sparkles, Star, TrendingUp, Users, Video, Bell, BriefcaseBusiness, LayoutDashboard, Menu, X } from 'lucide-react';
import {
  useGetMentors, getGetMentorsQueryKey, useGetMentor, getGetMentorQueryKey,
  useGetBookings, getGetBookingsQueryKey, useCreateBooking,
  useGetDashboard, getGetDashboardQueryKey, useGetReviews, getGetReviewsQueryKey,
  useCreateReview, useGetMessages, getGetMessagesQueryKey, useSendMessage,
  useGetNotifications, getGetNotificationsQueryKey, useMarkNotificationRead,
  useGetProgress, getGetProgressQueryKey,
} from '@workspace/api-client-react';
import NotFound from '@/pages/not-found';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

const queryClient = new QueryClient();
const navItems = [
  ['Home','/'],['Find a mentor','/mentors'],['Student home','/student/dashboard'],['My progress','/student/progress'],
  ['Mentor home','/mentor/dashboard'],['Become a mentor','/mentor/onboarding'],['Messages','/messages'],['Notifications','/notifications'],
  ['Admin overview','/admin/dashboard'],['Users','/admin/users'],['Mentors','/admin/mentors'],['Bookings','/admin/bookings'],
  ['Payments','/admin/payments'],['Reports','/admin/reports'],['Analytics','/admin/analytics'],['Sign in','/login'],['Join','/register'],
] as const;
const initials = (s = 'M') => s.split(' ').map(x => x[0]).slice(0,2).join('').toUpperCase();

function Shell({ children }: { children: ReactNode }) {
  const [loc] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  return <div className="shell">
    <header className="topbar"><div className="nav-inner">
      <Link href="/" className="brand" data-testid="link-brand"><span className="brand-mark">m</span>mentorbridge</Link>
      <button className="mobile-toggle" type="button" aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={menuOpen} aria-controls="primary-navigation" onClick={() => setMenuOpen(!menuOpen)} data-testid="button-mobile-navigation">{menuOpen ? <X size={20}/> : <Menu size={20}/>}</button>
      <nav id="primary-navigation" className={`nav-links ${menuOpen ? 'mobile-open' : ''}`} aria-label="Main navigation">
        {navItems.map(([label,href]) => <Link key={href} href={href} onClick={() => setMenuOpen(false)} className={`nav-link ${loc===href?'active':''}`} data-testid={`link-nav-${href.replaceAll('/','-').replace(/^-/, 'home')}`}>{label}</Link>)}
      </nav><span className="demo-pill">Demo environment</span>
    </div></header>
    <main>{children}</main>
    <footer className="footer"><span>MentorBridge · Find your next perspective.</span><span>Sample data only. No connected payments, calls, or live accounts.</span></footer>
  </div>;
}
function PageHead({ kicker, title, detail, action }: { kicker:string; title:string; detail?:string; action?:ReactNode }) {
  return <div className="section-head"><div><div className="eyebrow">{kicker}</div><h1 className="serif" style={{fontSize:'clamp(30px,4vw,44px)',letterSpacing:'-.055em',margin:'7px 0 6px'}}>{title}</h1>{detail&&<p className="muted" style={{margin:0,fontSize:14}}>{detail}</p>}</div>{action}</div>;
}
function DemoNotice({ children='Seeded sample information for product demonstration. Not a live integration.' }: {children?:ReactNode}) {
  return <div className="notice" data-testid="status-demo-notice"><strong>Demo mode</strong> · {children}</div>;
}
function Loading({ rows=3 }: {rows?:number}) { return <div style={{display:'grid',gap:12}} aria-label="Loading">{Array.from({length:rows},(_,i)=><div className="skeleton" key={i}/>)}</div>; }
function QueryState({ loading,error,retry,children }: {loading:boolean;error:boolean;retry:()=>void;children:ReactNode}) {
  if(loading)return <Loading/>;
  if(error)return <div className="card empty"><CircleHelp size={28}/><h3>We couldn’t load this yet</h3><p>Check your connection and try again.</p><button className="btn btn-soft" onClick={retry} data-testid="button-retry">Try again</button></div>;
  return <>{children}</>;
}
function Avatar({name,color='#087d76',size=54}:{name:string;color?:string;size?:number}) {
  return <div className="avatar" style={{width:size,height:size,background:color}} aria-label={`${name} initials`}>{initials(name)}</div>;
}
function Home() {
  const {data:mentors,isLoading,isError,refetch}=useGetMentors();
  const featured=(mentors||[]).slice(0,3);
  return <div className="page-wrap animate-rise">
    <div className="hero"><div className="hero-copy"><span className="demo-pill" style={{background:'#f4a180',color:'#174c48'}}>Built for the in-between moments</span>
      <h1>Your next step<br/>starts with a person.</h1><p>Honest career conversations with people who remember what it felt like to be where you are.</p>
      <div style={{display:'flex',gap:11,flexWrap:'wrap',marginTop:25}}><Link className="btn" style={{background:'#dff1e9',color:'#124d48'}} href="/mentors" data-testid="link-explore-mentors">Find your mentor <ArrowRight size={16}/></Link><Link className="btn" style={{color:'#eff9f5',borderColor:'rgba(239,249,245,.46)'}} href="/register" data-testid="link-create-account">Explore as a student</Link></div>
    </div><div className="orb" aria-hidden="true"><span>m—</span></div></div>
    <div style={{display:'flex',justifyContent:'space-between',gap:15,alignItems:'center',margin:'17px 1px 36px',flexWrap:'wrap'}}><div className="muted" style={{fontSize:12}}>No pressure, no perfect résumé required. Just a good conversation.</div><DemoNotice>All profiles and activity shown here are seeded demo information.</DemoNotice></div>
    <section style={{marginBottom:55}}><PageHead kicker="A bridge, not a shortcut" title="Real perspective. Practical next steps." detail="A good mentor doesn't hand you a map. They help you read the one you're already holding."/>
      <div className="grid-auto">
        {[{icon:<Compass/>,title:'Find your fit',text:'Browse people by field, lived experience, and what you need right now.',tone:'#dcefe8'},{icon:<MessageCircle/>,title:'Start with a conversation',text:'Book a focused one-to-one session built around your questions.',tone:'#f8e3d9'},{icon:<TrendingUp/>,title:'Make progress visible',text:'Turn a helpful conversation into goals you can actually follow.',tone:'#f8edcf'}].map(x=><div className="card" key={x.title}><div style={{display:'grid',placeItems:'center',width:42,height:42,borderRadius:13,background:x.tone,color:'hsl(var(--primary))'}}>{x.icon}</div><h3 className="serif" style={{fontSize:20,margin:'17px 0 7px'}}>{x.title}</h3><p className="muted" style={{fontSize:13,lineHeight:1.7,margin:0}}>{x.text}</p></div>)}
      </div>
    </section>
    <section style={{marginBottom:55}}><PageHead kicker="Good people to know" title="A few thoughtful first matches" detail="Seeded sample mentor profiles—made to show how matching could feel." action={<Link href="/mentors" className="btn btn-plain" data-testid="link-all-mentors">Browse all <ArrowUpRight size={15}/></Link>}/>
      <QueryState loading={isLoading} error={isError} retry={()=>refetch()}>{featured.length?<div className="grid-auto">{featured.map(m=><MentorCard key={m.id} mentor={m}/>)}</div>:<Empty title="Mentors are finding their way here" text="Try browsing again soon."/>}</QueryState>
    </section>
    <section className="card" style={{display:'grid',gridTemplateColumns:'1.2fr .8fr',gap:28,alignItems:'center',background:'#e4f1eb',marginBottom:48}}>
      <div><div className="eyebrow">A softer kind of networking</div><h2 className="serif" style={{fontSize:34,lineHeight:1.05,letterSpacing:'-.05em',maxWidth:520}}>You don't need to have it figured out to start.</h2><p className="muted" style={{lineHeight:1.7,maxWidth:500}}>Come with a question, a draft, or just a direction you keep circling back to. That's enough to begin.</p><Link href="/student/progress" className="btn btn-primary" data-testid="link-see-progress">See a sample progress space <ArrowRight size={15}/></Link></div>
      <div className="card" style={{background:'#f3f9f5'}}><span className="eyebrow">One small next step</span><h3 className="serif" style={{fontSize:23}}>Ask someone how they got there.</h3><div className="progress-track"><div className="progress-fill" style={{width:'62%'}}/></div><div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginTop:9}}><span className="muted">Your journey, your pace</span><strong>62%</strong></div></div>
    </section>
  </div>;
}
function MentorCard({mentor:m}:{mentor:any}) {
  return <article className="card" data-testid={`card-mentor-${m.id}`} style={{position:'relative',overflow:'hidden'}}>
    <div style={{display:'flex',gap:13,alignItems:'center'}}><Avatar name={m.name} color={m.companyColor||'#087d76'}/><div style={{minWidth:0}}><h3 style={{margin:'0 0 3px',fontSize:15}} data-testid={`text-mentor-name-${m.id}`}>{m.name}</h3><div className="muted" style={{fontSize:11}}>{m.title} · {m.company}</div></div>{m.verified&&<BadgeCheck size={18} color="#08756e" aria-label="Verified demo profile"/>}</div>
    <div style={{display:'flex',gap:7,margin:'15px 0',flexWrap:'wrap'}}><span className="tag">{m.category}</span><span className="tag"><MapPin size={11}/>{m.location}</span></div>
    <div style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}><Star size={14} fill="#d97724" color="#d97724"/><strong>{m.rating}</strong><span className="muted">({m.reviewCount} reviews)</span><span style={{marginLeft:'auto',fontWeight:800}}>${m.price}<span className="muted" style={{fontWeight:400}}>/ session</span></span></div>
    <p className="muted" style={{fontSize:12,lineHeight:1.6,minHeight:38}}>{m.bio}</p><Link href={`/mentors/${m.id}`} className="btn btn-soft" style={{width:'100%'}} data-testid={`link-mentor-profile-${m.id}`}>View profile <ArrowRight size={14}/></Link>
  </article>;
}
function Empty({title,text}:{title:string;text:string}) {return <div className="card empty"><Sparkles size={25}/><h3>{title}</h3><p>{text}</p></div>}
function MentorsPage() {
  const [search,setSearch]=useState(''); const [category,setCategory]=useState(''); const [minRating,setRating]=useState('');
  const params={search:search||undefined,category:category||undefined,minRating:minRating?Number(minRating):undefined};
  const q=useGetMentors(params);
  return <div className="page-wrap"><PageHead kicker="Meet your people" title="Find a mentor who gets it." detail="Search by field or focus. These are sample profiles, not connected accounts."/>
    <DemoNotice/>
    <div className="card" style={{margin:'18px 0 22px',display:'grid',gridTemplateColumns:'2fr 1fr 1fr auto',gap:12,alignItems:'end'}}>
      <label className="field">Search mentors<div style={{position:'relative'}}><Search size={17} style={{position:'absolute',left:12,top:13,color:'#64817a'}}/><input className="input" style={{paddingLeft:38}} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Name, company, or skill" aria-label="Search mentors" data-testid="input-mentor-search"/></div></label>
      <label className="field">Field<select className="input" value={category} onChange={e=>setCategory(e.target.value)} aria-label="Filter by field" data-testid="select-mentor-category"><option value="">All fields</option>{['Technology','Design','Product','Business','Data','Marketing','Finance'].map(c=><option key={c}>{c}</option>)}</select></label>
      <label className="field">Minimum rating<select className="input" value={minRating} onChange={e=>setRating(e.target.value)} aria-label="Minimum rating" data-testid="select-min-rating"><option value="">Any rating</option><option value="4">4.0 and up</option><option value="4.5">4.5 and up</option></select></label>
      <button className="btn btn-plain" onClick={()=>{setSearch('');setCategory('');setRating('')}} data-testid="button-clear-filters"><Filter size={15}/> Clear</button>
    </div>
    <QueryState loading={q.isLoading} error={q.isError} retry={()=>q.refetch()}>{(q.data||[]).length?<div className="grid-auto">{q.data!.map(m=><MentorCard mentor={m} key={m.id}/>)}</div>:<Empty title="No matches yet" text="Try widening your filters. A different search can open a new door."/>}</QueryState>
  </div>;
}
function MentorProfile() {
  const {id=''}=useParams<{id:string}>(); const q=useGetMentor(id,{query:{queryKey:getGetMentorQueryKey(id)}});
  const reviews=useGetReviews({mentorId:id}); const createReview=useCreateReview(); const qc=useQueryClient();
  const [comment,setComment]=useState(''); const [rating,setRating]=useState(5);
  const mentor=q.data;
  return <div className="page-wrap">
    <QueryState loading={q.isLoading} error={q.isError} retry={()=>q.refetch()}>{mentor?<><DemoNotice/><div className="card" style={{marginTop:17,padding:28}}>
      <div style={{display:'flex',gap:20,alignItems:'center',flexWrap:'wrap'}}><Avatar name={mentor.name} color={mentor.companyColor||'#087d76'} size={82}/><div style={{flex:1,minWidth:220}}><div className="eyebrow">{mentor.category} · {mentor.location}</div><h1 className="serif" style={{margin:'7px 0',fontSize:40,letterSpacing:'-.06em'}}>{mentor.name}</h1><p style={{margin:0}}>{mentor.title} at <strong>{mentor.company}</strong> {mentor.verified&&<span className="tag"><BadgeCheck size={12}/> Sample verified badge</span>}</p></div><div style={{textAlign:'right'}}><div style={{fontSize:22,fontWeight:800}}>${mentor.price}<small className="muted" style={{fontSize:11,fontWeight:400}}> / session</small></div><Link className="btn btn-primary" href={`/booking/${mentor.id}`} data-testid="link-book-mentor">Choose a time <CalendarDays size={15}/></Link></div></div>
      <div style={{display:'grid',gridTemplateColumns:'1.4fr .6fr',gap:30,marginTop:30}}><div><h2 className="serif">A little about me</h2><p className="muted" style={{lineHeight:1.8}}>{mentor.bio}</p><h3>Where I can help</h3><div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{mentor.skills.map(s=><span className="tag" key={s}>{s}</span>)}</div></div><div className="stat"><small>MENTOR SNAPSHOT</small><strong>{mentor.experienceYears} yrs</strong><span className="muted">of experience</span><div style={{marginTop:12}}><Star size={14} fill="#d97724" color="#d97724"/> {mentor.rating} <span className="muted">from {mentor.reviewCount} sample reviews</span></div><p className="muted" style={{fontSize:12}}>Availability: {mentor.availability}</p><p className="muted" style={{fontSize:12}}>{mentor.sessions} demo sessions shown</p></div></div></div>
    <section style={{marginTop:35}}><PageHead kicker="Words from students" title="A few reflections" detail="Reviews in this demo are seeded examples."/><QueryState loading={reviews.isLoading} error={reviews.isError} retry={()=>reviews.refetch()}>{(reviews.data||[]).length?<div className="grid-auto">{reviews.data!.map(r=><div className="card" key={r.id}><div style={{display:'flex',justifyContent:'space-between'}}><strong>{r.studentName}</strong><span style={{color:'#a95719'}}>{'★'.repeat(r.rating)}</span></div><p className="muted" style={{lineHeight:1.7}}>{r.comment}</p><small className="muted">{r.date} · {r.tags.join(' · ')}</small></div>)}</div>:<Empty title="The first note is still waiting" text="No demo reviews are available for this profile."/>}</QueryState>
      <form className="card" style={{marginTop:16}} onSubmit={e=>{e.preventDefault();createReview.mutate({data:{mentorId:id,rating,comment,tags:['Helpful']}},{onSuccess:()=>{setComment('');qc.invalidateQueries({queryKey:getGetReviewsQueryKey({mentorId:id})});qc.invalidateQueries({queryKey:getGetMentorsQueryKey()})}})}}><h3 className="serif">Leave a sample review</h3><div style={{display:'grid',gridTemplateColumns:'150px 1fr auto',gap:12,alignItems:'end'}}><label className="field">Rating<select className="input" value={rating} onChange={e=>setRating(Number(e.target.value))} data-testid="select-review-rating">{[5,4,3,2,1].map(n=><option key={n} value={n}>{n} stars</option>)}</select></label><label className="field">Your reflection<input className="input" value={comment} minLength={3} required onChange={e=>setComment(e.target.value)} placeholder="What felt useful?" data-testid="input-review-comment"/></label><button className="btn btn-primary" disabled={createReview.isPending} data-testid="button-submit-review">{createReview.isPending?'Sending…':'Submit review'}</button></div>{createReview.isError&&<p role="alert" className="muted">Could not submit. Please try again.</p>}</form>
      </section></>:<Empty title="Profile not found" text="This mentor may not be part of the current sample set."/>}</QueryState>
  </div>;
}
function BookingPage() {
  const {id=''}=useParams<{id:string}>(); const mentorQ=useGetMentor(id,{query:{queryKey:getGetMentorQueryKey(id)}}); const create=useCreateBooking(); const qc=useQueryClient();
  const [step,setStep]=useState(1); const [type,setType]=useState('Career clarity'); const [date,setDate]=useState(''); const [time,setTime]=useState('10:00 AM'); const [done,setDone]=useState(false);
  const m=mentorQ.data;
  if(done)return <div className="page-wrap"><div className="card" style={{maxWidth:700,margin:'40px auto',textAlign:'center',padding:44}}><div className="brand-mark" style={{margin:'auto',width:54,height:54,borderRadius:18}}><Check/></div><div className="eyebrow" style={{marginTop:20}}>Demo booking request</div><h1 className="serif">A plan is taking shape.</h1><p className="muted">Your sample booking has been created. No payment was taken and no meeting link was connected.</p><DemoNotice>Booking state is demo data; no calendar or payment provider is linked.</DemoNotice><Link href="/student/dashboard" className="btn btn-primary" style={{marginTop:18}} data-testid="link-booking-dashboard">Go to student dashboard</Link></div></div>;
  return <div className="page-wrap" style={{maxWidth:840}}><PageHead kicker="Make space for a conversation" title="Book a session" detail="A simple demo flow. No charge is collected."/><QueryState loading={mentorQ.isLoading} error={mentorQ.isError} retry={()=>mentorQ.refetch()}>{m?<><DemoNotice>Payment and video meeting are placeholders only. Nothing is charged.</DemoNotice><div className="card" style={{marginTop:18}}><div style={{display:'flex',gap:14,alignItems:'center',paddingBottom:20,borderBottom:'1px solid hsl(var(--border))'}}><Avatar name={m.name}/><div style={{flex:1}}><strong>{m.name}</strong><div className="muted" style={{fontSize:12}}>{m.title} · {m.company}</div></div><strong>${m.price}</strong></div><div style={{display:'flex',gap:10,margin:'22px 0'}}>{['Session','Schedule','Review'].map((s,i)=><div key={s} style={{flex:1,padding:'11px 8px',borderRadius:10,background:step===i+1?'#dcefe8':'#edf4ef',color:step===i+1?'#15564f':'#5f7770',fontSize:12,fontWeight:700}}><span style={{marginRight:8}}>{i+1}</span>{s}</div>)}</div>
        {step===1&&<div><h2 className="serif">What would you like to work on?</h2><div className="grid-auto">{['Career clarity','Portfolio feedback','Interview practice','A different question'].map(x=><button key={x} className={`btn ${type===x?'btn-primary':'btn-soft'}`} onClick={()=>setType(x)} data-testid={`button-session-${x.toLowerCase().replaceAll(' ','-')}`}>{x}</button>)}</div><div style={{textAlign:'right',marginTop:24}}><button className="btn btn-primary" onClick={()=>setStep(2)} data-testid="button-booking-next">Choose a time <ChevronRight size={15}/></button></div></div>}
        {step===2&&<div><h2 className="serif">Find a moment that works.</h2><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}><label className="field">Date<input type="date" className="input" min={new Date().toISOString().slice(0,10)} value={date} onChange={e=>setDate(e.target.value)} required data-testid="input-booking-date"/></label><label className="field">Time<select className="input" value={time} onChange={e=>setTime(e.target.value)} data-testid="select-booking-time">{['10:00 AM','11:30 AM','1:00 PM','3:30 PM','4:30 PM'].map(t=><option key={t}>{t}</option>)}</select></label></div><p className="muted" style={{fontSize:12}}>Sample availability only; calendar sync is not connected.</p><div style={{display:'flex',justifyContent:'space-between',marginTop:20}}><button className="btn btn-plain" onClick={()=>setStep(1)} data-testid="button-booking-back">Back</button><button className="btn btn-primary" disabled={!date} onClick={()=>setStep(3)} data-testid="button-booking-next">Review booking <ChevronRight size={15}/></button></div></div>}
        {step===3&&<div><h2 className="serif">A quick look before you confirm.</h2><div className="stat" style={{margin:'18px 0'}}><p><strong>Session</strong><span style={{float:'right'}}>{type}</span></p><p><strong>When</strong><span style={{float:'right'}}>{date} · {time}</span></p><p><strong>Demo total</strong><span style={{float:'right'}}>${m.price}</span></p></div><div className="notice"><CreditCard size={15}/> Payment is a non-functional placeholder. This demo will not collect card details or charge you.</div><div style={{display:'flex',justifyContent:'space-between',marginTop:20}}><button className="btn btn-plain" onClick={()=>setStep(2)} data-testid="button-booking-back">Back</button><button className="btn btn-primary" disabled={create.isPending} onClick={()=>create.mutate({data:{mentorId:id,type,date,time}},{onSuccess:()=>{qc.invalidateQueries({queryKey:getGetBookingsQueryKey({role:'student'})});setDone(true)}})} data-testid="button-confirm-booking">{create.isPending?'Saving…':'Confirm demo booking'} <ArrowRight size={15}/></button></div>{create.isError&&<p role="alert">Booking couldn’t be saved. Try again.</p>}</div>}
      </div></>:<Empty title="Mentor unavailable" text="Return to search to choose another profile."/>}</QueryState></div>;
}
function DemoEntry({register=false}:{register?:boolean}) {
  const [,setLocation]=useLocation(); const [role,setRole]=useState<'student'|'mentor'|'admin'>('student');
  const go=()=>setLocation(role==='mentor'?'/mentor/dashboard':role==='admin'?'/admin/dashboard':'/student/dashboard');
  return <div className="page-wrap" style={{maxWidth:760}}><div className="card" style={{padding:32}}><div className="eyebrow">Demo entry · no account required</div><h1 className="serif" style={{fontSize:42,letterSpacing:'-.06em'}}>{register?'Try a role preview':'Welcome back, explorer.'}</h1><p className="muted">This is a product preview, not authentication. No password or personal account credentials are collected or stored.</p><DemoNotice>Choosing a preview role only changes which sample dashboard you see. It is not secure authentication or authorization.</DemoNotice><fieldset style={{border:0,padding:0,margin:'24px 0'}}><legend className="field" style={{marginBottom:12}}>Choose a sample experience</legend><div className="grid-auto">{(['student','mentor','admin'] as const).map(r=><button type="button" key={r} onClick={()=>setRole(r)} className={`btn ${role===r?'btn-primary':'btn-soft'}`} data-testid={`button-role-${r}`}><Users size={15}/>{r[0].toUpperCase()+r.slice(1)} preview</button>)}</div></fieldset><button className="btn btn-primary" onClick={go} data-testid="button-enter-demo">Continue to {role} preview <ArrowRight size={16}/></button></div></div>;
}
function DashboardPage({role}:{role:'student'|'mentor'|'admin'}) {
  const params={role}; const d=useGetDashboard(params,{query:{queryKey:getGetDashboardQueryKey(params)}}); const b=useGetBookings({role:role==='admin'?undefined:role});
  const title=role==='student'?'Your next chapter':role==='mentor'?'A good day to make a difference':'A clear view of the community';
  const bookings=b.data||[];
  return <div className="page-wrap"><PageHead kicker={`${role} dashboard · sample view`} title={title} detail={role==='student'?'A personal space for the conversations and goals you’re building.':role==='mentor'?'Your demo mentoring workspace.':'Sample marketplace operations overview.'} action={<Link href="/notifications" className="btn btn-soft" data-testid="link-dashboard-notifications"><Bell size={15}/> Updates</Link>}/>
    <DemoNotice>Metrics and bookings are seeded product examples, not verified real activity.</DemoNotice>
    <QueryState loading={d.isLoading||b.isLoading} error={d.isError||b.isError} retry={()=>{d.refetch();b.refetch()}}>{d.data?<><div className="grid-auto" style={{margin:'18px 0'}}>{(role==='student'?[['Sessions',d.data.sessions],['Upcoming',d.data.upcoming],['Goal progress',`${d.data.progress}%`],['Focus',d.data.activity?.length||0]]:role==='mentor'?[['Sessions',d.data.sessions],['Upcoming',d.data.upcoming],['Students',d.data.students],['Sample rating',d.data.rating]]:[['Sessions',d.data.sessions],['Upcoming',d.data.upcoming],['Mentors',d.data.students],['Progress',`${d.data.progress}%`]]).map(([label,value])=><div className="stat" key={label}><small>{label}</small><strong>{value}</strong></div>)}</div>
      <div style={{display:'grid',gridTemplateColumns:'1.3fr .7fr',gap:17}}><div className="card"><div className="section-head"><div><div className="eyebrow">On the calendar</div><h2 className="serif" style={{margin:'6px 0'}}>Upcoming conversations</h2></div><Link className="btn btn-plain" href="/student/progress" data-testid="link-dashboard-progress">Your progress <ArrowRight size={14}/></Link></div>{bookings.length?bookings.slice(0,5).map((x:any)=><div key={x.id} data-testid={`row-booking-${x.id}`} style={{display:'flex',gap:14,alignItems:'center',padding:'13px 0',borderTop:'1px solid hsl(var(--border))'}}><div style={{width:42,height:42,borderRadius:13,background:'#dcefe8',display:'grid',placeItems:'center',color:'hsl(var(--primary))'}}><CalendarDays size={18}/></div><div style={{flex:1}}><strong>{x.mentorName||x.studentName}</strong><div className="muted" style={{fontSize:12}}>{x.type} · {x.date} at {x.time}</div></div><span className={`status ${x.status}`}>{x.status}</span></div>):<Empty title="A little room in the calendar" text="Your sample bookings will appear here."/>}</div>
        <div className="card"><div className="eyebrow">{role==='student'?'Momentum':'Recent activity'}</div><h2 className="serif">Small moves count.</h2>{(d.data.activity||[]).map((a:string,i:number)=><div key={`${a}-${i}`} style={{display:'flex',gap:10,padding:'12px 0',borderTop:'1px solid hsl(var(--border))'}}><span className="tag">{String(i+1).padStart(2,'0')}</span><span style={{fontSize:13,lineHeight:1.5}}>{a}</span></div>)}<Link href={role==='mentor'?'/mentor/onboarding':'/student/progress'} className="btn btn-primary" style={{width:'100%',marginTop:12}} data-testid="link-dashboard-action">{role==='mentor'?'Complete your profile':'View your goals'} <ArrowRight size={14}/></Link></div></div></>:<Empty title="Dashboard is taking a breath" text="Sample metrics could not be found."/>}</QueryState>
  </div>;
}
function ProgressPage() {
  const q=useGetProgress({query:{queryKey:getGetProgressQueryKey()}});
  return <div className="page-wrap"><PageHead kicker="Student space · demo" title="Progress, at your pace." detail="One conversation at a time is still momentum."/><DemoNotice/>
    <QueryState loading={q.isLoading} error={q.isError} retry={()=>q.refetch()}>{q.data?<div style={{display:'grid',gridTemplateColumns:'1fr .8fr',gap:17,marginTop:20}}><div className="card"><div className="eyebrow">Current direction</div><h2 className="serif" style={{fontSize:30}}>{q.data.goal}</h2><div style={{display:'flex',justifyContent:'space-between',margin:'25px 0 8px'}}><span className="muted">Steady progress</span><strong>{q.data.completion}%</strong></div><div className="progress-track"><div className="progress-fill" style={{width:`${q.data.completion}%`}}/></div><h3 style={{marginTop:28}}>Your next few steps</h3>{q.data.nextSteps.map((s:string,i:number)=><div key={s} style={{display:'flex',alignItems:'center',gap:11,padding:'12px 0',borderTop:'1px solid hsl(var(--border))'}}><span className="tag">{i+1}</span><span style={{fontSize:13}}>{s}</span><button className="btn btn-plain" style={{marginLeft:'auto',padding:'7px 10px'}} onClick={e=>{const el=e.currentTarget;el.textContent=el.textContent==='Done'?'Mark done':'Done'}} data-testid={`button-progress-step-${i}`}>Mark done</button></div>)}</div><div className="card"><div className="eyebrow">Skills in motion</div><h2 className="serif">Growing by doing.</h2>{q.data.skills.map((s:any)=><div key={s.name} style={{padding:'12px 0'}}><div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:7}}><strong>{s.name}</strong><span className="muted">{s.value}%</span></div><div className="progress-track"><div className="progress-fill" style={{width:`${s.value}%`,background:s.color||'hsl(var(--primary))'}}/></div></div>)}<Link href="/mentors" className="btn btn-primary" style={{width:'100%',marginTop:12}} data-testid="link-progress-mentor">Find someone to help <ArrowRight size={14}/></Link></div></div>:<Empty title="Your plan is still open" text="Progress data isn't available right now."/>}</QueryState>
  </div>;
}
function MentorOnboarding() {
  const [submitted,setSubmitted]=useState(false);
  return <div className="page-wrap" style={{maxWidth:800}}><PageHead kicker="For people with a story to share" title="Make room for someone else." detail="A profile preview helps students understand your experience."/><DemoNotice>Submitting creates no real mentor account; this is a local profile preview only.</DemoNotice>{submitted?<div className="card" style={{marginTop:18}}><div className="eyebrow">Preview ready</div><h2 className="serif">A thoughtful place to begin.</h2><p className="muted">Your sample profile is ready for review in this demo. Nothing was published to a real marketplace.</p><button className="btn btn-soft" onClick={()=>setSubmitted(false)} data-testid="button-edit-onboarding">Edit preview</button></div>:<form className="card" style={{marginTop:18,display:'grid',gridTemplateColumns:'1fr 1fr',gap:15}} onSubmit={e=>{e.preventDefault();setSubmitted(true)}}><label className="field">Name<input className="input" required placeholder="Your name" data-testid="input-mentor-name"/></label><label className="field">Current role<input className="input" required placeholder="Role and company" data-testid="input-mentor-title"/></label><label className="field">Area you know best<select className="input" data-testid="select-mentor-focus">{['Technology','Design','Product','Business','Data','Marketing'].map(x=><option key={x}>{x}</option>)}</select></label><label className="field">Years of experience<input className="input" type="number" min="1" required placeholder="6" data-testid="input-mentor-years"/></label><label className="field" style={{gridColumn:'1 / -1'}}>What would you enjoy helping with?<textarea className="input" required rows={4} placeholder="Share a little about the questions you can help students work through." data-testid="input-mentor-bio"/></label><button className="btn btn-primary" style={{gridColumn:'1 / -1',justifySelf:'start'}} data-testid="button-preview-profile">Preview mentor profile <ArrowRight size={15}/></button></form>}</div>;
}
function MessagesPage() {
  const conversationId='demo-student-mentor'; const q=useGetMessages({conversationId},{query:{queryKey:getGetMessagesQueryKey({conversationId})}});
  const send=useSendMessage(); const qc=useQueryClient(); const [body,setBody]=useState('');
  return <div className="page-wrap"><PageHead kicker="Messages · preview" title="A conversation, not a connection." detail="Sample thread only. Live messaging is not connected."/><DemoNotice>Messages are a demo interaction; they are not delivered to a real person.</DemoNotice>
    <QueryState loading={q.isLoading} error={q.isError} retry={()=>q.refetch()}><div className="card" style={{maxWidth:820,marginTop:18}}><div style={{display:'flex',gap:12,alignItems:'center',paddingBottom:15,borderBottom:'1px solid hsl(var(--border))'}}><Avatar name="Maya Chen"/><div><strong>Maya Chen</strong><div className="muted" style={{fontSize:11}}>Product design mentor · sample profile</div></div><span className="tag" style={{marginLeft:'auto'}}>Demo thread</span></div><div style={{padding:'16px 0',minHeight:250,maxHeight:430,overflow:'auto'}}>{(q.data||[]).length?(q.data||[]).map(msg=><div key={msg.id} data-testid={`message-item-${msg.id}`} style={{display:'flex',justifyContent:msg.mine?'flex-end':'flex-start',margin:'11px 0'}}><div style={{maxWidth:'76%',padding:'12px 14px',borderRadius:15,background:msg.mine?'#d9eee5':'#edf4ef',fontSize:13,lineHeight:1.6}}>{msg.body}<div className="muted" style={{fontSize:10,marginTop:5}}>{msg.sender} · {msg.time}</div></div></div>):<Empty title="The thread is quiet" text="Send a sample note to start exploring this screen."/>}</div><form onSubmit={e=>{e.preventDefault();send.mutate({data:{conversationId,body}},{onSuccess:()=>{setBody('');qc.invalidateQueries({queryKey:getGetMessagesQueryKey({conversationId})})}})}} style={{display:'flex',gap:9,borderTop:'1px solid hsl(var(--border))',paddingTop:14}}><input className="input" value={body} onChange={e=>setBody(e.target.value)} required maxLength={2000} placeholder="Write a sample message…" aria-label="Message body" data-testid="input-message-body"/><button className="btn btn-primary" disabled={send.isPending} data-testid="button-send-message">{send.isPending?'Sending…':'Send'} <ArrowRight size={14}/></button></form>{send.isError&&<p role="alert" className="muted">This sample message couldn’t be added. Try again.</p>}</div></QueryState>
  </div>;
}
function NotificationsPage() {
  const q=useGetNotifications({query:{queryKey:getGetNotificationsQueryKey()}}); const mark=useMarkNotificationRead(); const qc=useQueryClient();
  return <div className="page-wrap" style={{maxWidth:850}}><PageHead kicker="Your inbox · sample" title="A few things to know." detail="Notification examples only; no real account events are monitored."/><DemoNotice/><QueryState loading={q.isLoading} error={q.isError} retry={()=>q.refetch()}>{(q.data||[]).length?<div style={{display:'grid',gap:11,marginTop:18}}>{q.data!.map(n=><article key={n.id} className="card" data-testid={`notification-${n.id}`} style={{display:'flex',alignItems:'center',gap:14}}><div style={{width:40,height:40,borderRadius:13,background:n.unread?'#f8e3d9':'#dcefe8',display:'grid',placeItems:'center',color:'#08756e'}}><Bell size={17}/></div><div style={{flex:1}}><strong>{n.title}</strong><div className="muted" style={{fontSize:13,marginTop:3}}>{n.detail}</div><small className="muted">{n.time} · demo</small></div>{n.unread&&<><span className="tag">New</span><button className="btn btn-plain" onClick={()=>mark.mutate({id:n.id},{onSuccess:()=>qc.invalidateQueries({queryKey:getGetNotificationsQueryKey()})})} disabled={mark.isPending} data-testid={`button-mark-read-${n.id}`}>Mark read</button></>}</article>)}</div>:<Empty title="All caught up" text="There are no sample notifications to show."/>}</QueryState></div>;
}
const adminRoutes=[
  ['/admin/users','Users','People preview','Directory of sample marketplace participants.'],
  ['/admin/mentors','Mentors','Mentor profiles','Review demo profiles and their directory status.'],
  ['/admin/bookings','Bookings','Booking activity','A sample overview of marketplace sessions.'],
  ['/admin/payments','Payments','Payment placeholders','No payment processor is connected and no money moves here.'],
  ['/admin/reports','Reports','Reports & review','A calm place to scan sample reports and marketplace health.'],
  ['/admin/analytics','Analytics','Analytics snapshot','Illustrative product metrics, not live customer activity.'],
] as const;
function AdminDashboard() {
  const d=useGetDashboard({role:'admin'},{query:{queryKey:getGetDashboardQueryKey({role:'admin'})}});
  return <div className="page-wrap"><PageHead kicker="Operations · demo" title="A small window into the marketplace." detail="Admin role previews are not a security boundary; everything here is sample data."/><DemoNotice>These controls and metrics do not administer real accounts.</DemoNotice><QueryState loading={d.isLoading} error={d.isError} retry={()=>d.refetch()}>{d.data?<><div className="grid-auto" style={{margin:'18px 0'}}>{[['Sample sessions',d.data.sessions],['Upcoming',d.data.upcoming],['Mentor profiles',d.data.students],['Marketplace pulse',`${d.data.progress}%`]].map(([a,b])=><div className="stat" key={a}><small>{a}</small><strong>{b}</strong></div>)}</div><div className="grid-auto">{adminRoutes.map(([path,label,title,detail])=><Link href={path} key={path} className="card" style={{textDecoration:'none',color:'inherit'}} data-testid={`link-admin-${label.toLowerCase()}`}><span className="eyebrow">{label} · sample</span><h2 className="serif" style={{margin:'9px 0'}}>{title}</h2><p className="muted" style={{fontSize:13}}>{detail}</p><span className="tag">Open view <ArrowRight size={12}/></span></Link>)}</div></>:<Empty title="Admin overview unavailable" text="Try reloading the sample dashboard."/>}</QueryState></div>;
}
function AdminData({path,label,title,detail}:{path:string;label:string;title:string;detail:string}) {
  const role=path.includes('mentors')?'mentors':path.includes('bookings')?'bookings':path.includes('users')?'users':path.includes('payments')?'payments':path.includes('reports')?'reports':'analytics';
  const mentors=useGetMentors(); const bookings=useGetBookings(); const notices=useGetNotifications();
  const source=role==='mentors'?mentors.data:role==='bookings'||role==='payments'?bookings.data:null;
  const busy=role==='mentors'?mentors.isLoading:role==='bookings'||role==='payments'?bookings.isLoading:role==='users'?mentors.isLoading||bookings.isLoading:notices.isLoading;
  const error=role==='mentors'?mentors.isError:role==='bookings'||role==='payments'?bookings.isError:role==='users'?mentors.isError||bookings.isError:notices.isError;
  const retry=()=>{mentors.refetch();bookings.refetch();notices.refetch()};
  return <div className="page-wrap"><PageHead kicker={`Admin · ${label.toLowerCase()} · preview`} title={title} detail={detail}/><DemoNotice>Read-only seeded examples; changes here do not affect a real service.</DemoNotice>
    <div className="section-head" style={{marginTop:22}}><div><div className="eyebrow">Tools</div><h2 className="serif" style={{margin:'6px 0'}}>Admin areas</h2></div></div><div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:20}}>{adminRoutes.map(([p,l])=><Link key={p} className={`btn ${p===path?'btn-primary':'btn-soft'}`} href={p} data-testid={`link-admin-tab-${l.toLowerCase()}`}>{l}</Link>)}</div>
    <QueryState loading={busy} error={error} retry={retry}>
       {(source||role==='users'||role==='reports'||role==='analytics')?<div className="card" style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:13,textAlign:'left'}}><thead><tr>{(role==='mentors'?['Mentor','Field','Rating','Sessions','Status']:role==='bookings'?['Booking','Student','Session','Date','Status']:role==='payments'?['Reference','Participant','Amount','Payment state']:role==='users'?['Sample person','Role','Activity']:['Signal','Example','State']).map(h=><th key={h} style={{padding:12,color:'#5a716d',fontSize:10,textTransform:'uppercase',letterSpacing:'.09em'}}>{h}</th>)}</tr></thead><tbody>
        {role==='mentors'&&(source as any[]).map(m=><tr key={m.id} data-testid={`row-admin-mentor-${m.id}`}><td style={{padding:12,borderTop:'1px solid hsl(var(--border))'}}><strong>{m.name}</strong><div className="muted">{m.company}</div></td><td>{m.category}</td><td>{m.rating} / 5</td><td>{m.sessions}</td><td><span className="status">sample verified</span></td></tr>)}
        {role==='bookings'&&(source as any[]).map(b=><tr key={b.id} data-testid={`row-admin-booking-${b.id}`}><td style={{padding:12,borderTop:'1px solid hsl(var(--border))'}}>{b.id}</td><td>{b.studentName}</td><td>{b.mentorName} · {b.type}</td><td>{b.date} · {b.time}</td><td><span className={`status ${b.status}`}>{b.status}</span></td></tr>)}
        {role==='payments'&&(source as any[]).map(b=><tr key={b.id}><td style={{padding:12,borderTop:'1px solid hsl(var(--border))'}}>DEMO-{b.id}</td><td>{b.studentName} · {b.mentorName}</td><td>${b.price}</td><td><span className="status pending">Not processed</span></td></tr>)}
        {role==='users'&&[...(mentors.data||[]).map(m=>({name:m.name,role:'Mentor'})),{name:'Alex Morgan',role:'Student'},{name:'Jordan Lee',role:'Student'}].map((u,i)=><tr key={`${u.name}-${i}`}><td style={{padding:12,borderTop:'1px solid hsl(var(--border))'}}>{u.name}</td><td>{u.role} · demo</td><td>Seeded activity only</td></tr>)}
        {(role==='reports'||role==='analytics')&&[
          ['Profile completeness',`${mentors.data?.length||0} sample profiles`,'Illustrative'],
          ['Booking volume',`${bookings.data?.length||0} sample sessions`,'Not live'],
          ['Inbox activity',`${notices.data?.length||0} seeded alerts`,'Not connected'],
        ].map(([a,b,c])=><tr key={a}><td style={{padding:12,borderTop:'1px solid hsl(var(--border))'}}>{a}</td><td>{b}</td><td><span className="status pending">{c}</span></td></tr>)}
      </tbody></table></div>:<Empty title="No sample records found" text="The demo dataset has no records for this area yet."/>}
    </QueryState>
    {role==='payments'&&<div className="notice" style={{marginTop:14}}><CreditCard size={15}/> Payment rows describe sample booking amounts only. No transactions, card data, or refunds exist.</div>}
  </div>;
}
function Router() {
  const [loc]=useLocation();
  return <ErrorBoundary resetKey={loc}><Shell><Switch>
    <Route path="/" component={Home}/><Route path="/login"><DemoEntry/></Route><Route path="/register"><DemoEntry register/></Route>
    <Route path="/mentors" component={MentorsPage}/><Route path="/mentors/:id" component={MentorProfile}/><Route path="/booking/:id" component={BookingPage}/>
    <Route path="/student/dashboard"><DashboardPage role="student"/></Route><Route path="/student/progress" component={ProgressPage}/>
    <Route path="/mentor/dashboard"><DashboardPage role="mentor"/></Route><Route path="/mentor/onboarding" component={MentorOnboarding}/>
    <Route path="/messages" component={MessagesPage}/><Route path="/notifications" component={NotificationsPage}/>
    <Route path="/admin/dashboard" component={AdminDashboard}/>
    {adminRoutes.map(([path,label,title,detail])=><Route key={path} path={path}><AdminData path={path} label={label} title={title} detail={detail}/></Route>)}
    <Route component={NotFound}/>
  </Switch></Shell></ErrorBoundary>;
}
function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/,'')}><Router/></WouterRouter><Toaster/></TooltipProvider></QueryClientProvider>;
}
export default App;
