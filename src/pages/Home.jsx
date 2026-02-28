import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import ChatPanel from "@/components/chat/ChatPanel";

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const avatarColors = ["#1a1a2e","#16213e","#0f3460","#533483","#2b2d42","#8d2935","#1b4332","#b5451b"];
const coverGradients = [
  "linear-gradient(135deg,#1a1a2e 0%,#0f3460 100%)",
  "linear-gradient(135deg,#2d1b69 0%,#11998e 100%)",
  "linear-gradient(135deg,#0f2027 0%,#2c5364 100%)",
  "linear-gradient(135deg,#373b44 0%,#4286f4 100%)",
  "linear-gradient(135deg,#1a1a1a 0%,#434343 100%)",
];
const typeColors = { food:"#f5a623", culture:"#4a90d9", leisure:"#7ed321", transport:"#9b9b9b" };
const initials = name => name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
const colorFor  = name => { let h=0; for(let c of name) h=(h*31+c.charCodeAt(0))%avatarColors.length; return avatarColors[h]; };
const now = () => new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});

// ─── SEED DATA ────────────────────────────────────────────────────────────────
const SEED = [
  { id:"g1", name:"Lisbon 2025", emoji:"🇵🇹", cover:coverGradients[0], coverUrl:null,
    lastMsg:"Anyone up for Pastéis de Belém?", lastTime:"9:12 AM", unread:3,
    members:[
      {id:"u1",name:"Alex Chen",  role:"admin", from:"San Francisco, CA",bio:"Adventure seeker. Always first to explore.", joined:"Jan 2025",photoUrl:null},
      {id:"u2",name:"Jamie Park", role:"member",from:"New York, NY",      bio:"Food lover and photographer.",             joined:"Jan 2025",photoUrl:null},
      {id:"u3",name:"Sam Rivera", role:"member",from:"Austin, TX",        bio:"Culture enthusiast. Museum card holder.",  joined:"Feb 2025",photoUrl:null},
      {id:"u4",name:"Morgan Lee", role:"member",from:"Chicago, IL",       bio:"Night owl, morning coffee, always late.",  joined:"Feb 2025",photoUrl:null},
      {id:"u5",name:"Taylor Winn",role:"member",from:"Seattle, WA",       bio:"Hiker. Will drag you on detours.",         joined:"Feb 2025",photoUrl:null},
      {id:"u6",name:"Jordan Moss",role:"member",from:"Miami, FL",         bio:"Beach > everything. Certified snorkeler.", joined:"Feb 2025",photoUrl:null},
      {id:"u7",name:"Casey Ngo",  role:"member",from:"Portland, OR",      bio:"Budget spreadsheet queen.",                joined:"Mar 2025",photoUrl:null},
      {id:"u8",name:"Riley Stone",role:"member",from:"Denver, CO",        bio:"Outdoorsy. Brings too much gear.",         joined:"Mar 2025",photoUrl:null},
    ],
    messages:[
      {id:1,user:"Alex Chen", text:"Just landed in Lisbon! 🛬",                    time:"9:02 AM", type:"text"},
      {id:2,user:"Jamie Park",text:"Welcome! Weather is perfect today.",            time:"9:05 AM", type:"text"},
      {id:3,user:"Sam Rivera",text:"Anyone up for Pastéis de Belém this morning?", time:"9:10 AM", type:"text"},
      {id:4,user:"Morgan Lee",text:"100% yes, meeting in the lobby at 10?",         time:"9:12 AM", type:"text"},
    ],
    announcements:[
      {id:1,pinned:true, title:"Bus Departure", body:"Bus departs Hotel Avenida 8:00 AM sharp. Don't be late!", time:"Yesterday", author:"Alex Chen"},
      {id:2,pinned:false,title:"Dinner Tonight",body:"Group dinner at Solar dos Presuntos — 7:30 PM. Smart casual.", time:"Today 8 AM",author:"Alex Chen"},
    ],
    itinerary:[
      {day:"Day 1",date:"Mar 3",items:[
        {time:"10:00 AM",event:"Pastéis de Belém",   type:"food"},
        {time:"1:00 PM", event:"Jerónimos Monastery",type:"culture"},
        {time:"4:00 PM", event:"Belém Tower",        type:"culture"},
        {time:"7:30 PM", event:"Group Dinner",       type:"food"},
      ]},
      {day:"Day 2",date:"Mar 4",items:[
        {time:"9:00 AM", event:"Alfama Walking Tour",type:"culture"},
        {time:"12:30 PM",event:"Time Out Market",    type:"food"},
        {time:"3:00 PM", event:"LX Factory",         type:"leisure"},
        {time:"6:00 PM", event:"Miradouro da Graça", type:"leisure"},
      ]},
    ],
    photos:[
      {id:1,user:"Alex Chen", caption:"Morning over the Tagus",color:"#e8e0d5",emoji:"🌅",url:null,mediaType:"image"},
      {id:2,user:"Jamie Park",caption:"The famous egg tarts!", color:"#f2e8dc",emoji:"🥐",url:null,mediaType:"image"},
      {id:3,user:"Sam Rivera",caption:"Azulejo tiles",         color:"#d5e0e8",emoji:"🏛️",url:null,mediaType:"image"},
      {id:4,user:"Morgan Lee",caption:"São Jorge Castle",      color:"#dde8d5",emoji:"🏰",url:null,mediaType:"image"},
    ],
    invites:[
      {id:1,email:"drew@email.com", status:"pending",  sent:"2 days ago"},
      {id:2,email:"avery@email.com",status:"accepted", sent:"3 days ago"},
    ],
  },
  { id:"g2", name:"Tokyo Spring", emoji:"🇯🇵", cover:coverGradients[1], coverUrl:null,
    lastMsg:"Cherry blossom forecast looks 🌸", lastTime:"Yesterday", unread:1,
    members:[
      {id:"u1", name:"Alex Chen",  role:"admin", from:"San Francisco, CA",bio:"Adventure seeker.",      joined:"Mar 2025",photoUrl:null},
      {id:"u9", name:"Drew Kim",   role:"member",from:"Boston, MA",        bio:"Ramen connoisseur.",     joined:"Mar 2025",photoUrl:null},
      {id:"u10",name:"Avery Walsh",role:"member",from:"LA, CA",            bio:"Anime & street food.",   joined:"Mar 2025",photoUrl:null},
      {id:"u11",name:"Quinn Diaz", role:"member",from:"Houston, TX",       bio:"Always lost, always happy.",joined:"Mar 2025",photoUrl:null},
      {id:"u12",name:"Blake Ford", role:"member",from:"Philadelphia, PA",  bio:"Architecture nerd.",     joined:"Mar 2025",photoUrl:null},
    ],
    messages:[
      {id:1,user:"Drew Kim",   text:"Cherry blossom forecast looks amazing 🌸",time:"Yesterday",type:"text"},
      {id:2,user:"Avery Walsh",text:"I've booked Ichiran Ramen for night 1",   time:"Yesterday",type:"text"},
    ],
    announcements:[{id:1,pinned:true,title:"Flights Confirmed",body:"All flights confirmed April 2nd. Meet SFO Terminal 2 by 7 AM.",time:"2 days ago",author:"Alex Chen"}],
    itinerary:[{day:"Day 1",date:"Apr 2",items:[{time:"3:00 PM",event:"Check-in Shinjuku Hotel",type:"transport"},{time:"7:00 PM",event:"Welcome Ramen Dinner",type:"food"}]}],
    photos:[{id:1,user:"Quinn Diaz",caption:"Mood board 🌸",color:"#f7e8f0",emoji:"🌸",url:null,mediaType:"image"}],
    invites:[],
  },
  { id:"g3", name:"Amalfi Coast", emoji:"🇮🇹", cover:coverGradients[2], coverUrl:null,
    lastMsg:"Who's renting a boat? 🛥️", lastTime:"Mon", unread:0,
    members:[
      {id:"u1", name:"Alex Chen",  role:"admin", from:"San Francisco, CA",bio:"Adventure seeker.",joined:"Apr 2025",photoUrl:null},
      {id:"u4", name:"Morgan Lee", role:"admin", from:"Chicago, IL",      bio:"Night owl.",       joined:"Apr 2025",photoUrl:null},
      {id:"u13",name:"Hayden Cruz",role:"member",from:"Nashville, TN",    bio:"Boat enthusiast.", joined:"Apr 2025",photoUrl:null},
      {id:"u14",name:"Skyler Hunt",role:"member",from:"Phoenix, AZ",      bio:"Pasta lover.",     joined:"Apr 2025",photoUrl:null},
    ],
    messages:[
      {id:1,user:"Hayden Cruz",text:"Who's renting a boat? 🛥️",    time:"Mon",type:"text"},
      {id:2,user:"Morgan Lee", text:"I'm in! Positano to Capri 🤌", time:"Mon",type:"text"},
    ],
    announcements:[],
    itinerary:[{day:"Day 1",date:"Jun 1",items:[{time:"2:00 PM",event:"Arrive Positano",type:"transport"},{time:"8:00 PM",event:"Seafood dinner by water",type:"food"}]}],
    photos:[],
    invites:[],
  },
];

const ME_DEFAULT = {id:"u1",name:"Alex Chen",role:"admin",from:"San Francisco, CA",bio:"Adventure seeker. Always first to explore.",photoUrl:null};

// ─── AVATAR ───────────────────────────────────────────────────────────────────
function Av({ name, photoUrl, size=40, ring=false }) {
  const s = {width:size,height:size,borderRadius:"50%",flexShrink:0,border:ring?"2.5px solid #fff":"none"};
  if (photoUrl) return <img src={photoUrl} alt={name} style={{...s,objectFit:"cover"}}/>;
  return <div style={{...s,background:colorFor(name),color:"#fff",fontSize:size*.31,fontWeight:700,letterSpacing:".03em",display:"flex",alignItems:"center",justifyContent:"center"}}>{initials(name)}</div>;
}

// ─── MEDIA UPLOAD BUTTON ──────────────────────────────────────────────────────
function MediaUploadBtn({ onUploaded, style={}, children }) {
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  const handleChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const mediaType = file.type.startsWith("video/") ? "video" : "image";
      onUploaded({ url: file_url, mediaType, fileName: file.name });
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  return (
    <>
      <button onClick={() => ref.current?.click()} disabled={loading}
        title="Upload photo or video"
        style={{ cursor: loading ? "default" : "pointer", opacity: loading ? 0.5 : 1, ...style }}>
        {loading ? "⏳" : children}
      </button>
      <input ref={ref} type="file" accept="image/*,video/mp4,video/mov,video/quicktime"
        onChange={handleChange} style={{ display:"none" }} />
    </>
  );
}

// ─── CHAT MEDIA BUBBLE ────────────────────────────────────────────────────────
function MediaBubble({ msg }) {
  const isVideo = msg.mediaType === "video";
  return (
    <div style={{ maxWidth:220, borderRadius: msg.isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px", overflow:"hidden", position:"relative" }}>
      {isVideo
        ? <video src={msg.mediaUrl} controls style={{ width:"100%", maxHeight:200, display:"block", background:"#000" }} />
        : <img src={msg.mediaUrl} alt="shared" style={{ width:"100%", maxHeight:220, objectFit:"cover", display:"block" }} />
      }
      {msg.text && (
        <div style={{ padding:"7px 10px", background: msg.isMe ? "#1a1a1a" : "#f5f5f3", fontSize:13, color: msg.isMe?"#fff":"#333", lineHeight:1.4 }}>
          {msg.text}
        </div>
      )}
      <div style={{ position:"absolute", top:7, right:7, background:"rgba(0,0,0,.5)", borderRadius:20, padding:"2px 7px", fontSize:10, color:"#fff", backdropFilter:"blur(4px)" }}>
        {isVideo ? "🎬 video" : "🖼 photo"}
      </div>
    </div>
  );
}

// ─── PHOTO GRID CARD ──────────────────────────────────────────────────────────
function PhotoCard({ p }) {
  const isVideo = p.mediaType === "video";
  return (
    <div style={{ borderRadius:16, overflow:"hidden", background: p.url ? "#000" : p.color, cursor:"pointer", boxShadow:"0 2px 8px rgba(0,0,0,.07)", transition:"transform .2s", position:"relative" }}
      onMouseEnter={e=>e.currentTarget.style.transform="scale(1.02)"}
      onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
      {p.url
        ? isVideo
          ? <video src={p.url} style={{ width:"100%", height:120, objectFit:"cover", display:"block" }} muted playsInline />
          : <img src={p.url} alt={p.caption} style={{ width:"100%", height:120, objectFit:"cover", display:"block" }} />
        : <div style={{ height:90, display:"flex", alignItems:"center", justifyContent:"center", fontSize:34 }}>{p.emoji}</div>
      }
      {isVideo && p.url && (
        <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-70%)", background:"rgba(0,0,0,.55)", borderRadius:"50%", width:36, height:36, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, color:"#fff", pointerEvents:"none" }}>▶</div>
      )}
      <div style={{ padding:"8px 12px 12px", background: p.url ? "rgba(0,0,0,.35)" : undefined }}>
        <div style={{ fontSize:12, color: p.url?"#fff":"#444", lineHeight:1.3, marginBottom:3, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{p.caption}</div>
        <div style={{ fontSize:10, color: p.url?"rgba(255,255,255,.65)":"#aaa", fontWeight:500, display:"flex", alignItems:"center", gap:4 }}>
          {isVideo && <span>🎬</span>} {p.user}
        </div>
      </div>
      {p.fromChat && (
        <div style={{ position:"absolute", top:7, left:7, background:"rgba(0,0,0,.5)", borderRadius:20, padding:"2px 7px", fontSize:9, color:"#fff", backdropFilter:"blur(4px)", fontWeight:600 }}>💬 chat</div>
      )}
    </div>
  );
}

// ─── BOTTOM SHEET ─────────────────────────────────────────────────────────────
function Sheet({ onClose, title, children }) {
  return (
    <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,.42)",zIndex:200,borderRadius:24,display:"flex",alignItems:"flex-end"}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",background:"#fff",borderRadius:"20px 20px 0 0",maxHeight:"90%",overflowY:"auto",animation:"sheetUp .22s ease"}}>
        <div style={{padding:"14px 20px 0",display:"flex",justifyContent:"center"}}><div style={{width:36,height:4,background:"#e0e0e0",borderRadius:2}}/></div>
        {title&&<div style={{padding:"10px 20px 12px",fontFamily:"'DM Serif Display',serif",fontSize:19,color:"#1a1a1a",borderBottom:"1px solid #f0f0ee"}}>{title}</div>}
        <div style={{padding:"4px 20px 28px"}}>{children}</div>
      </div>
    </div>
  );
}

function Chip({children,bg="#f0f0ee",color="#666"}){ return <span style={{fontSize:9,padding:"2px 8px",borderRadius:20,background:bg,color,fontWeight:700,letterSpacing:".06em",whiteSpace:"nowrap"}}>{children}</span>; }
function StatBox({label,value,vc="#1a1a1a"}){ return <div style={{background:"#f5f5f3",borderRadius:14,padding:14,textAlign:"center"}}><div style={{fontSize:10,color:"#bbb",letterSpacing:".08em",marginBottom:5}}>{label}</div><div style={{fontSize:14,fontWeight:600,color:vc}}>{value}</div></div>; }
function Empty({icon,text}){ return <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:200,color:"#ccc",gap:8}}><span style={{fontSize:34}}>{icon}</span><div style={{fontSize:13}}>{text}</div></div>; }

function Wrap({ children }) {
  return (
    <div style={{fontFamily:"'DM Sans','Helvetica Neue',sans-serif",background:"#e8e4df",minHeight:"100vh",display:"flex",justifyContent:"center",alignItems:"flex-start"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&family=DM+Serif+Display:ital@0;1&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:3px;}
        ::-webkit-scrollbar-thumb{background:#e0e0dd;border-radius:2px;}
        button:focus,input:focus,textarea:focus{outline:none;}
        input:focus,textarea:focus{border-color:#bbb!important;}
        @keyframes slideUp{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
        @keyframes sheetUp{from{opacity:0;transform:translateY(22px);}to{opacity:1;transform:translateY(0);}}
        @keyframes pulse{0%,100%{opacity:.4;}50%{opacity:1;}}
      `}</style>
      <div style={{width:"100%",maxWidth:430,background:"#fff",overflow:"hidden",display:"flex",flexDirection:"column",minHeight:"100vh",position:"relative"}}>
        {children}
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function GfX() {
  const [screen, setScreen] = useState("home");
  const [groups, setGroups] = useState(SEED);
  const [gid, setGid]       = useState(null);
  const [tab, setTab]       = useState("chat");
  const [me, setMe]         = useState(ME_DEFAULT);

  const [sheetMember,  setSheetMember]  = useState(null);
  const [sheetAdmin,   setSheetAdmin]   = useState(false);
  const [sheetInvite,  setSheetInvite]  = useState(false);
  const [sheetCreate,  setSheetCreate]  = useState(false);
  const [sheetProfile, setSheetProfile] = useState(false);
  const [photoFilter,  setPhotoFilter]  = useState("all");

  const [chatInput, setChatInput] = useState("");
  const [activeDay, setActiveDay] = useState(0);
  const [openAnn,   setOpenAnn]   = useState(null);
  const [mSearch,   setMSearch]   = useState("");
  const [iEmail,    setIEmail]    = useState("");
  const [iName,     setIName]     = useState("");
  const [iSent,     setISent]     = useState(false);
  const [copied,    setCopied]    = useState(false);
  const [ngName,    setNgName]    = useState("");
  const [ngEmoji,   setNgEmoji]   = useState("✈️");
  const [egName,    setEgName]    = useState("");
  const [myBio,     setMyBio]     = useState(ME_DEFAULT.bio);
  const [myFrom,    setMyFrom]    = useState(ME_DEFAULT.from);
  const [newPhotoBadge, setNewPhotoBadge] = useState(false);

  const msgEnd = useRef(null);

  const G = groups.find(g=>g.id===gid);
  const upd = (id, patch) => setGroups(gs=>gs.map(g=>g.id===id?{...g,...(typeof patch==="function"?patch(g):patch)}:g));
  const isGlobalAdmin = me.role === "admin";
  const isGroupAdmin = G ? G.members.some(m => m.name === me.name && m.role === "admin") : false;

  useEffect(()=>{ if(tab==="chat") msgEnd.current?.scrollIntoView({behavior:"smooth"}); },[G?.messages,tab]);
  useEffect(()=>{ if(tab==="photos") setNewPhotoBadge(false); },[tab]);

  const sendChat = () => {
    if(!chatInput.trim()) return;
    upd(gid,g=>({
      messages:[...g.messages,{id:Date.now(),user:"You",text:chatInput,time:now(),type:"text",isMe:true}],
      lastMsg:chatInput, lastTime:"Now",
    }));
    setChatInput("");
  };

  const sendMedia = ({ url, mediaType, fileName, caption="" }) => {
    const msgId = Date.now();
    const photoId = msgId + 1;
    const label = caption || (mediaType==="video" ? "🎬 Video" : "📷 Photo");

    upd(gid, g => ({
      messages: [...g.messages, {
        id: msgId,
        user: "You",
        text: caption,
        time: now(),
        type: "media",
        mediaType,
        mediaUrl: url,
        isMe: true,
      }],
      lastMsg: mediaType==="video" ? "🎬 Sent a video" : "📷 Sent a photo",
      lastTime: "Now",
      photos: [...g.photos, {
        id: photoId,
        user: "You",
        caption: label,
        color: "#e0e0e0",
        emoji: mediaType==="video" ? "🎬" : "🖼️",
        url,
        mediaType,
        fromChat: true,
      }],
    }));

    setNewPhotoBadge(true);
    setTimeout(()=>setNewPhotoBadge(false), 4000);
  };

  const sendInvite = () => {
    if(!iEmail.trim()) return;
    upd(gid,g=>({invites:[...g.invites,{id:Date.now(),email:iEmail,name:iName,status:"pending",sent:"Just now"}]}));
    setIEmail(""); setIName(""); setISent(true); setTimeout(()=>setISent(false),3000);
  };

  const createGroup = () => {
    if(!ngName.trim()) return;
    const id="g"+Date.now();
    setGroups(gs=>[...gs,{id,name:ngName,emoji:ngEmoji,cover:coverGradients[gs.length%coverGradients.length],coverUrl:null,lastMsg:"Group created",lastTime:"Now",unread:0,members:[{...me,role:"admin"}],messages:[],announcements:[],itinerary:[],photos:[],invites:[]}]);
    setNgName(""); setNgEmoji("✈️"); setSheetCreate(false);
  };

  const TABS = [
    {id:"chat",          icon:"💬", label:"Chat"},
    {id:"itinerary",     icon:"📅", label:"Schedule"},
    {id:"photos",        icon:"📸", label:"Photos"},
    {id:"announcements", icon:"📌", label:"Board"},
    {id:"members",       icon:"👥", label:"People"},
  ];

  // ════════════════════════════════════════════════════════════════════════════
  // HOME SCREEN
  // ════════════════════════════════════════════════════════════════════════════
  if (screen==="home") return (
    <Wrap>
      <div style={{padding:"22px 20px 10px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{fontFamily:"'DM Serif Display',serif",fontSize:30,color:"#1a1a1a",letterSpacing:"-.02em",lineHeight:1}}>gfX</div>
          <div style={{fontSize:11,color:"#bbb",marginTop:2}}>your trips, your crew</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={()=>setSheetProfile(true)} style={{background:"none",border:"none",cursor:"pointer",padding:0}}><Av name={me.name} photoUrl={me.photoUrl} size={36}/></button>
          {isGlobalAdmin && <button onClick={()=>setSheetCreate(true)} style={{width:36,height:36,borderRadius:"50%",background:"#1a1a1a",border:"none",cursor:"pointer",color:"#fff",fontSize:22,display:"flex",alignItems:"center",justifyContent:"center"}}>＋</button>}
        </div>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"6px 16px 20px",display:"flex",flexDirection:"column",gap:14}}>
        {groups.map(g=>(
          <div key={g.id} onClick={()=>{setGid(g.id);setTab("chat");setActiveDay(0);setScreen("group");setNewPhotoBadge(false);}}
            style={{borderRadius:20,overflow:"hidden",cursor:"pointer",boxShadow:"0 2px 18px rgba(0,0,0,.1)",transition:"transform .15s"}}
            onMouseEnter={e=>e.currentTarget.style.transform="scale(1.01)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
            <div style={{height:140,background:g.coverUrl?`url(${g.coverUrl}) center/cover`:g.cover,position:"relative"}}>
              <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,.6) 0%,transparent 60%)"}}/>
              <div style={{position:"absolute",bottom:12,left:16,right:16,display:"flex",alignItems:"flex-end",justifyContent:"space-between"}}>
                <div style={{zIndex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3}}><span style={{fontSize:18}}>{g.emoji}</span><div style={{fontFamily:"'DM Serif Display',serif",fontSize:20,color:"#fff"}}>{g.name}</div></div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,.65)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:240}}>{g.lastMsg}</div>
                </div>
                <div style={{zIndex:1,display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5}}>
                  {g.unread>0&&<div style={{background:"#ff3b30",color:"#fff",borderRadius:20,fontSize:10,fontWeight:700,padding:"2px 7px"}}>{g.unread}</div>}
                  <div style={{fontSize:10,color:"rgba(255,255,255,.55)"}}>{g.lastTime}</div>
                </div>
              </div>
            </div>
            <div style={{background:"#fff",padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex"}}>
                {g.members.slice(0,5).map((m,i)=>(
                  <div key={m.id} style={{marginLeft:i===0?0:"-9px",zIndex:5-i,position:"relative"}}><Av name={m.name} photoUrl={m.photoUrl} size={26} ring/></div>
                ))}
                {g.members.length>5&&<div style={{width:26,height:26,borderRadius:"50%",background:"#f0f0ee",border:"2.5px solid #fff",marginLeft:"-9px",fontSize:9,fontWeight:700,color:"#888",display:"flex",alignItems:"center",justifyContent:"center"}}>+{g.members.length-5}</div>}
              </div>
              <span style={{fontSize:11,color:"#ccc"}}>›</span>
            </div>
          </div>
        ))}
      </div>

      {sheetCreate&&(
        <Sheet onClose={()=>setSheetCreate(false)} title="New Trip Group">
          <div style={{paddingTop:14,display:"flex",flexDirection:"column",gap:12}}>
            <div style={{display:"flex",gap:10}}>
              <input value={ngEmoji} onChange={e=>setNgEmoji(e.target.value)} maxLength={2} style={{width:52,padding:"10px 0",borderRadius:12,border:"1.5px solid #eee",fontSize:22,textAlign:"center",background:"#fafaf8",fontFamily:"inherit"}}/>
              <input value={ngName} onChange={e=>setNgName(e.target.value)} placeholder="Trip name…" style={{flex:1,padding:"10px 14px",borderRadius:12,border:"1.5px solid #eee",fontSize:14,background:"#fafaf8",fontFamily:"inherit",color:"#1a1a1a"}}/>
            </div>
            <button onClick={createGroup} style={{padding:13,borderRadius:16,border:"none",background:"#1a1a1a",color:"#fff",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Create Group</button>
          </div>
        </Sheet>
      )}

      {sheetProfile&&(
        <Sheet onClose={()=>setSheetProfile(false)} title="My Profile">
          <div style={{paddingTop:14}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginBottom:18}}>
              <div style={{position:"relative",marginBottom:12}}>
                <Av name={me.name} photoUrl={me.photoUrl} size={80}/>
                <MediaUploadBtn onUploaded={({url})=>setMe(p=>({...p,photoUrl:url}))}
                  style={{position:"absolute",bottom:0,right:0,width:26,height:26,borderRadius:"50%",background:"#1a1a1a",border:"2px solid #fff",color:"#fff",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit",padding:0}}>
                  ✎
                </MediaUploadBtn>
              </div>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:22,color:"#1a1a1a"}}>{me.name}</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <input value={myFrom} onChange={e=>setMyFrom(e.target.value)} placeholder="Your city" style={{padding:"10px 14px",borderRadius:12,border:"1.5px solid #eee",fontSize:14,fontFamily:"inherit",background:"#fafaf8",color:"#1a1a1a"}}/>
              <textarea value={myBio} onChange={e=>setMyBio(e.target.value)} placeholder="Short bio…" rows={3} style={{padding:"10px 14px",borderRadius:12,border:"1.5px solid #eee",fontSize:14,fontFamily:"inherit",background:"#fafaf8",color:"#1a1a1a",resize:"none"}}/>
              <button onClick={()=>{setMe(p=>({...p,from:myFrom,bio:myBio}));setSheetProfile(false);}} style={{padding:13,borderRadius:16,border:"none",background:"#1a1a1a",color:"#fff",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Save Profile</button>
            </div>
          </div>
        </Sheet>
      )}
    </Wrap>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // GROUP SCREEN
  // ════════════════════════════════════════════════════════════════════════════
  const filteredPhotos = G.photos.filter(p => {
    if (photoFilter==="image") return p.mediaType==="image";
    if (photoFilter==="video") return p.mediaType==="video";
    if (photoFilter==="chat")  return p.fromChat;
    return true;
  });

  return (
    <Wrap>
      {/* hero cover */}
      <div style={{height:100,background:G.coverUrl?`url(${G.coverUrl}) center/cover`:G.cover,position:"relative",flexShrink:0}}>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,rgba(0,0,0,.18) 0%,rgba(0,0,0,.58) 100%)"}}/>
        <button onClick={()=>setScreen("home")} style={{position:"absolute",top:13,left:13,background:"rgba(255,255,255,.18)",backdropFilter:"blur(6px)",border:"none",borderRadius:10,padding:"5px 11px",color:"#fff",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>← Back</button>
        {isGroupAdmin && <button onClick={()=>setSheetAdmin(true)} style={{position:"absolute",top:13,right:13,background:"rgba(255,255,255,.18)",backdropFilter:"blur(6px)",border:"none",borderRadius:10,padding:"5px 11px",color:"#fff",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>⚙ Admin</button>}
        <div style={{position:"absolute",bottom:11,left:16}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:16}}>{G.emoji}</span><div style={{fontFamily:"'DM Serif Display',serif",fontSize:18,color:"#fff"}}>{G.name}</div></div>
          <div style={{fontSize:10,color:"rgba(255,255,255,.6)",marginTop:1}}>👥 {G.members.length} members</div>
        </div>
      </div>

      <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column",position:"relative"}}>

        {/* ── CHAT ─────────────────────────────────────────────────────────── */}
        {tab==="chat"&&(
          <ChatPanel
            groupId={gid}
            myName={me.name}
            members={G.members}
            onMediaSent={({url, mediaType}) => {
              upd(gid, g => ({
                photos: [...g.photos, {
                  id: Date.now(),
                  user: me.name,
                  caption: mediaType === "video" ? "🎬 Video" : "📷 Photo",
                  color: "#e0e0e0",
                  emoji: mediaType === "video" ? "🎬" : "🖼️",
                  url,
                  mediaType,
                  fromChat: true,
                }],
                lastMsg: mediaType === "video" ? "🎬 Sent a video" : "📷 Sent a photo",
                lastTime: "Now",
              }));
              setNewPhotoBadge(true);
              setTimeout(() => setNewPhotoBadge(false), 4000);
            }}
          />
        )}

        {/* ── ITINERARY ────────────────────────────────────────────────────── */}
        {tab==="itinerary"&&(
          <div style={{flex:1,overflowY:"auto",padding:16}}>
            {G.itinerary.length===0?<Empty icon="📅" text="No itinerary yet"/>:<>
              <div style={{display:"flex",gap:8,marginBottom:20}}>
                {G.itinerary.map((d,i)=>(
                  <button key={i} onClick={()=>setActiveDay(i)} style={{flex:1,padding:"8px 4px",borderRadius:12,border:"none",cursor:"pointer",background:activeDay===i?"#1a1a1a":"#f5f5f3",color:activeDay===i?"#fff":"#666",fontSize:12,fontWeight:500,fontFamily:"inherit",transition:"all .15s"}}>
                    <div style={{fontSize:10,opacity:.7}}>{d.day}</div><div>{d.date}</div>
                  </button>
                ))}
              </div>
              {G.itinerary[activeDay]?.items.map((item,i,arr)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:14,padding:"12px 0",borderBottom:i<arr.length-1?"1px solid #f0f0ee":"none"}}>
                  <div style={{width:56,fontSize:11,color:"#aaa",fontWeight:500,flexShrink:0}}>{item.time}</div>
                  <div style={{width:8,height:8,borderRadius:"50%",background:typeColors[item.type],flexShrink:0}}/>
                  <div style={{flex:1,fontSize:14,color:"#1a1a1a"}}>{item.event}</div>
                  <span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:typeColors[item.type]+"22",color:typeColors[item.type],fontWeight:500,textTransform:"capitalize"}}>{item.type}</span>
                </div>
              ))}
            </>}
          </div>
        )}

        {/* ── PHOTOS ───────────────────────────────────────────────────────── */}
        {tab==="photos"&&(
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{padding:"10px 16px 8px",display:"flex",gap:6,borderBottom:"1px solid #f5f5f5",flexShrink:0}}>
              {[{k:"all",label:"All"},{k:"image",label:"🖼 Photos"},{k:"video",label:"🎬 Videos"},{k:"chat",label:"💬 From Chat"}].map(f=>(
                <button key={f.k} onClick={()=>setPhotoFilter(f.k)} style={{padding:"5px 12px",borderRadius:20,border:"none",cursor:"pointer",background:photoFilter===f.k?"#1a1a1a":"#f0f0ee",color:photoFilter===f.k?"#fff":"#666",fontSize:11,fontWeight:600,fontFamily:"inherit",transition:"all .15s",whiteSpace:"nowrap"}}>
                  {f.label}
                </button>
              ))}
            </div>
            <div style={{flex:1,overflowY:"auto",padding:12}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                {filteredPhotos.map(p=><PhotoCard key={p.id} p={p}/>)}
                <MediaUploadBtn
                  onUploaded={({url,mediaType})=>upd(gid,g=>({photos:[...g.photos,{id:Date.now(),user:"You",caption:"New upload",color:"#e0e0e0",emoji:mediaType==="video"?"🎬":"🖼️",url,mediaType,fromChat:false}]}))}
                  style={{borderRadius:16,border:"1.5px dashed #ddd",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:5,minHeight:140,background:"transparent",color:"#bbb",fontSize:12,fontWeight:500,fontFamily:"inherit",padding:0,cursor:"pointer"}}>
                  <span style={{fontSize:22}}>＋</span>
                  <span>Photo or Video</span>
                </MediaUploadBtn>
              </div>
              {filteredPhotos.length===0&&<Empty icon="🖼️" text={`No ${photoFilter==="chat"?"chat media":photoFilter==="video"?"videos":"photos"} yet`}/>}
            </div>
          </div>
        )}

        {/* ── ANNOUNCEMENTS ────────────────────────────────────────────────── */}
        {tab==="announcements"&&(
          <div style={{flex:1,overflowY:"auto",padding:16}}>
            {G.announcements.filter(a=>a.pinned).length>0&&<div style={{fontSize:10,color:"#bbb",fontWeight:600,letterSpacing:".1em",marginBottom:8}}>📌 PINNED</div>}
            {G.announcements.slice().sort((a,b)=>b.pinned-a.pinned).map(ann=>(
              <div key={ann.id} onClick={()=>setOpenAnn(openAnn===ann.id?null:ann.id)} style={{padding:16,borderRadius:16,background:ann.pinned?"#fffbf0":"#fafaf8",marginBottom:10,cursor:"pointer",border:`1px solid ${ann.pinned?"#f5e6a3":"#f0f0ee"}`}}>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10}}>
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3}}>
                      <div style={{fontSize:14,fontWeight:600,color:"#1a1a1a"}}>{ann.title}</div>
                      {ann.pinned&&<Chip bg="#fff8dc" color="#b8860b">PINNED</Chip>}
                    </div>
                    <div style={{fontSize:11,color:"#bbb"}}>{ann.time} · {ann.author}</div>
                  </div>
                  <div style={{fontSize:11,color:"#ccc"}}>{openAnn===ann.id?"▲":"▼"}</div>
                </div>
                {openAnn===ann.id&&<div style={{marginTop:12,fontSize:14,color:"#555",lineHeight:1.55,paddingTop:12,borderTop:"1px solid #eee"}}>{ann.body}</div>}
              </div>
            ))}
            {G.announcements.length===0&&<Empty icon="📌" text="No announcements yet"/>}
            <div style={{padding:14,borderRadius:16,border:"1.5px dashed #ddd",color:"#bbb",fontSize:13,textAlign:"center",cursor:"pointer"}}>+ Post announcement</div>
          </div>
        )}

        {/* ── MEMBERS ──────────────────────────────────────────────────────── */}
        {tab==="members"&&(
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{padding:"12px 16px 8px",borderBottom:"1px solid #f0f0ee"}}>
              <div style={{display:"flex",gap:8,marginBottom:7}}>
                <input value={mSearch} onChange={e=>setMSearch(e.target.value)} placeholder="Search members…" style={{flex:1,padding:"8px 12px",borderRadius:12,border:"1.5px solid #eee",fontSize:13,background:"#fafaf8",fontFamily:"inherit",color:"#1a1a1a"}}/>
                <button onClick={()=>setSheetInvite(true)} style={{padding:"8px 14px",borderRadius:12,border:"none",background:"#1a1a1a",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>＋ Invite</button>
              </div>
              <div style={{fontSize:11,color:"#bbb"}}><span style={{fontWeight:600,color:"#888"}}>{G.members.length}</span> members · <span style={{fontWeight:600,color:"#888"}}>{G.invites.filter(i=>i.status==="pending").length}</span> pending</div>
            </div>
            <div style={{flex:1,overflowY:"auto"}}>
              {G.members.filter(m=>m.name.toLowerCase().includes(mSearch.toLowerCase())||m.from.toLowerCase().includes(mSearch.toLowerCase())).map(m=>(
                <div key={m.id} onClick={()=>setSheetMember(m)} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 16px",cursor:"pointer",transition:"background .12s"}}
                  onMouseEnter={e=>e.currentTarget.style.background="#f8f8f6"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <Av name={m.name} photoUrl={m.photoUrl} size={44}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <div style={{fontSize:14,fontWeight:600,color:"#1a1a1a"}}>{m.name}</div>
                      {m.role==="admin"&&<Chip bg="#1a1a1a" color="#fff">ADMIN</Chip>}
                      {m.muted&&<Chip bg="#f0f0ee" color="#aaa">MUTED</Chip>}
                    </div>
                    <div style={{fontSize:12,color:"#aaa",marginTop:2}}>📍 {m.from}</div>
                  </div>
                  <span style={{fontSize:18,color:"#e0e0e0"}}>›</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── MEMBER SHEET ─────────────────────────────────────────────────── */}
        {sheetMember&&(
          <Sheet onClose={()=>setSheetMember(null)}>
            <div style={{paddingTop:16}}>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginBottom:16}}>
                <Av name={sheetMember.name} photoUrl={sheetMember.photoUrl} size={78}/>
                <div style={{fontFamily:"'DM Serif Display',serif",fontSize:22,color:"#1a1a1a",marginTop:12}}>{sheetMember.name}</div>
                <div style={{display:"flex",gap:6,marginTop:6}}>
                  {sheetMember.role==="admin"&&<Chip bg="#1a1a1a" color="#fff">✦ ADMIN</Chip>}
                  {sheetMember.muted&&<Chip bg="#f0f0ee" color="#aaa">MUTED</Chip>}
                </div>
                <div style={{fontSize:13,color:"#aaa",marginTop:8}}>📍 {sheetMember.from}</div>
              </div>
              <div style={{background:"#fafaf8",borderRadius:14,padding:14,marginBottom:14}}>
                <div style={{fontSize:10,color:"#bbb",letterSpacing:".1em",marginBottom:7}}>BIO</div>
                <div style={{fontSize:14,color:"#555",lineHeight:1.6,fontStyle:"italic"}}>"{sheetMember.bio}"</div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                <StatBox label="JOINED" value={sheetMember.joined}/>
                <StatBox label="STATUS" value="● Active" vc="#3a7d44"/>
              </div>
              {sheetMember.id!=="u1"&&(
                <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
                  <div style={{fontSize:10,color:"#bbb",letterSpacing:".1em"}}>ADMIN ACTIONS</div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>{upd(gid,g=>({members:g.members.map(m=>m.id===sheetMember.id?{...m,role:m.role==="admin"?"member":"admin"}:m)}));setSheetMember(m=>({...m,role:m.role==="admin"?"member":"admin"}));}}
                      style={{flex:1,padding:"10px 0",borderRadius:12,border:"1.5px solid #eee",background:"#fafaf8",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",color:"#4a6fa5"}}>
                      {sheetMember.role==="admin"?"Remove Admin":"Promote Admin"}
                    </button>
                    <button onClick={()=>{upd(gid,g=>({members:g.members.map(m=>m.id===sheetMember.id?{...m,muted:!m.muted}:m)}));setSheetMember(m=>({...m,muted:!m.muted}));}}
                      style={{flex:1,padding:"10px 0",borderRadius:12,border:"1.5px solid #eee",background:"#fafaf8",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",color:"#c07a2f"}}>
                      {sheetMember.muted?"Unmute":"Mute"}
                    </button>
                  </div>
                  <button onClick={()=>{upd(gid,g=>({members:g.members.filter(m=>m.id!==sheetMember.id)}));setSheetMember(null);}}
                    style={{padding:"10px",borderRadius:12,border:"1.5px solid #fce4e4",background:"#fff5f5",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",color:"#d32f2f"}}>
                    Remove from Group
                  </button>
                </div>
              )}
              <button onClick={()=>setSheetMember(null)} style={{width:"100%",padding:13,borderRadius:16,border:"none",background:"#f5f5f3",color:"#666",fontSize:14,fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>Close</button>
            </div>
          </Sheet>
        )}

        {/* ── ADMIN SHEET ──────────────────────────────────────────────────── */}
        {sheetAdmin&&(
          <Sheet onClose={()=>setSheetAdmin(false)} title="⚙ Admin Panel">
            <div style={{paddingTop:14,display:"flex",flexDirection:"column",gap:12}}>
              <div style={{fontSize:10,color:"#bbb",letterSpacing:".1em"}}>GROUP NAME</div>
              <div style={{display:"flex",gap:8}}>
                <input value={egName||G.name} onChange={e=>setEgName(e.target.value)} style={{flex:1,padding:"10px 14px",borderRadius:12,border:"1.5px solid #eee",fontSize:14,fontFamily:"inherit",background:"#fafaf8",color:"#1a1a1a"}}/>
                <button onClick={()=>{upd(gid,{name:egName||G.name});setEgName("");}} style={{padding:"10px 16px",borderRadius:12,border:"none",background:"#1a1a1a",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Save</button>
              </div>
              <div style={{fontSize:10,color:"#bbb",letterSpacing:".1em",marginTop:4}}>COVER PHOTO</div>
              <MediaUploadBtn onUploaded={({url})=>upd(gid,{coverUrl:url})}
                style={{padding:11,borderRadius:12,border:"1.5px dashed #ddd",background:"#fafaf8",fontSize:13,color:"#888",cursor:"pointer",fontFamily:"inherit",width:"100%"}}>
                📷  Upload cover photo
              </MediaUploadBtn>
              {G.announcements.length>0&&<>
                <div style={{fontSize:10,color:"#bbb",letterSpacing:".1em",marginTop:4}}>PIN / UNPIN ANNOUNCEMENTS</div>
                {G.announcements.map(ann=>(
                  <div key={ann.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderRadius:12,background:"#fafaf8",border:"1px solid #f0f0ee"}}>
                    <div style={{fontSize:13,color:"#333"}}>{ann.title}</div>
                    <button onClick={()=>upd(gid,g=>({announcements:g.announcements.map(a=>a.id===ann.id?{...a,pinned:!a.pinned}:a)}))}
                      style={{padding:"5px 12px",borderRadius:10,border:"none",background:ann.pinned?"#fff8dc":"#f0f0ee",color:ann.pinned?"#b8860b":"#666",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                      {ann.pinned?"Unpin":"Pin"}
                    </button>
                  </div>
                ))}
              </>}
              <button onClick={()=>{setGroups(gs=>gs.filter(g=>g.id!==gid));setSheetAdmin(false);setScreen("home");}}
                style={{marginTop:4,padding:13,borderRadius:16,border:"1.5px solid #fce4e4",background:"#fff5f5",color:"#d32f2f",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                🗑 Delete Trip
              </button>
              <button onClick={()=>setSheetAdmin(false)} style={{padding:13,borderRadius:16,border:"none",background:"#f5f5f3",color:"#666",fontSize:14,fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>Done</button>
            </div>
          </Sheet>
        )}

        {/* ── INVITE SHEET ─────────────────────────────────────────────────── */}
        {sheetInvite&&(
          <Sheet onClose={()=>{setSheetInvite(false);setISent(false);}} title="Invite Someone">
            <div style={{paddingTop:14,display:"flex",flexDirection:"column",gap:11}}>
              <div style={{background:"#fafaf8",borderRadius:14,padding:14}}>
                <div style={{fontSize:10,color:"#bbb",letterSpacing:".1em",marginBottom:9}}>SHARE INVITE LINK</div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <div style={{flex:1,fontSize:11,color:"#999",background:"#eee",padding:"8px 12px",borderRadius:10,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>gfx.app/join/{gid}-xk9</div>
                  <button onClick={()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);}} style={{padding:"8px 14px",borderRadius:10,border:"none",background:copied?"#3a7d44":"#1a1a1a",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"background .2s",whiteSpace:"nowrap"}}>{copied?"✓ Copied":"Copy"}</button>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10}}><div style={{flex:1,height:1,background:"#eee"}}/><div style={{fontSize:11,color:"#bbb"}}>or email</div><div style={{flex:1,height:1,background:"#eee"}}/></div>
              <input value={iName} onChange={e=>setIName(e.target.value)} placeholder="Name (optional)" style={{padding:"11px 14px",borderRadius:12,border:"1.5px solid #eee",fontSize:14,fontFamily:"inherit",background:"#fafaf8",color:"#1a1a1a"}}/>
              <input value={iEmail} onChange={e=>setIEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendInvite()} placeholder="Email address" style={{padding:"11px 14px",borderRadius:12,border:"1.5px solid #eee",fontSize:14,fontFamily:"inherit",background:"#fafaf8",color:"#1a1a1a"}}/>
              {iSent&&<div style={{background:"#f0faf2",border:"1px solid #c3e6cb",borderRadius:12,padding:"10px 14px",fontSize:13,color:"#3a7d44",fontWeight:500}}>✓ Invite sent!</div>}
              <button onClick={sendInvite} style={{padding:13,borderRadius:16,border:"none",background:"#1a1a1a",color:"#fff",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Send Invite</button>
              {G.invites.length>0&&(
                <div style={{marginTop:6}}>
                  <div style={{fontSize:10,color:"#bbb",letterSpacing:".1em",marginBottom:8}}>SENT INVITES</div>
                  {G.invites.map(inv=>(
                    <div key={inv.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #f5f5f3"}}>
                      <div>
                        <div style={{fontSize:13,color:"#444"}}>{inv.name?`${inv.name} (${inv.email})`:inv.email}</div>
                        <div style={{fontSize:11,color:"#bbb",marginTop:2}}>{inv.sent}</div>
                      </div>
                      <span style={{fontSize:10,padding:"3px 9px",borderRadius:20,fontWeight:600,background:inv.status==="accepted"?"#f0faf2":"#fef9ec",color:inv.status==="accepted"?"#3a7d44":"#c07a2f"}}>
                        {inv.status==="accepted"?"✓ Accepted":"⏳ Pending"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Sheet>
        )}

      </div>

      {/* ── BOTTOM NAV ───────────────────────────────────────────────────────── */}
      <div style={{display:"flex",borderTop:"1px solid #f0f0ee",padding:"5px 6px 10px",gap:2}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"6px 2px",borderRadius:12,border:"none",cursor:"pointer",background:tab===t.id?"#f5f5f3":"transparent",display:"flex",flexDirection:"column",alignItems:"center",gap:2,fontFamily:"inherit",transition:"background .13s",position:"relative"}}>
            <span style={{fontSize:15}}>{t.icon}</span>
            <span style={{fontSize:9,fontWeight:500,color:tab===t.id?"#1a1a1a":"#bbb"}}>{t.label}</span>
            {t.id==="photos" && newPhotoBadge && tab!=="photos" && (
              <div style={{position:"absolute",top:4,right:"18%",width:7,height:7,borderRadius:"50%",background:"#ff3b30",animation:"pulse 1.2s infinite"}}/>
            )}
          </button>
        ))}
      </div>
    </Wrap>
  );
}