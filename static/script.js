let currentUser = null;
let selectedRole = 'tutor'; // 'tutor' or 'guardian'
let currentAuthMode = 'signin'; // 'signin' or 'signup'

window.onload = function() {
    checkSession();
};

// Check Active Session from Server
function checkSession() {
    fetch('/api/auth/me')
        .then(res => res.json())
        .then(data => {
            if (data.logged_in) {
                currentUser = data.user;
                renderAuthenticatedUI();
            } else {
                currentUser = null;
                renderLoggedOutUI();
            }
        });
}

// Render Authenticated Dashboard
function renderAuthenticatedUI() {
    document.getElementById('auth-actions-logged-out').style.display = 'none';
    document.getElementById('auth-actions-logged-in').style.display = 'flex';
    
    document.getElementById('nav-username').innerText = currentUser.name;
    document.getElementById('side-name').innerText = currentUser.name;
    document.getElementById('side-id-label').innerText = `${currentUser.role.toUpperCase()} ID: ${currentUser.custom_id}`;

    // Render Side Menu based on Role
    const menuContainer = document.getElementById('menu-items');
    if (currentUser.role === 'tutor') {
        menuContainer.innerHTML = `
            <li class="menu-item active" onclick="loadTutorDashboard()"><span>🏠</span> Dashboard</li>
            <li class="menu-item" onclick="loadTuitionJobs()"><span>🎛️</span> Tuition Jobs</li>
            <li class="menu-item" onclick="loadMyProfile()"><span>👤</span> My Profile</li>
            <li class="menu-item"><span>📋</span> Tutoring History</li>
            <li class="menu-item"><span>💳</span> My Payment</li>
            <li class="menu-item"><span>⚙️</span> Settings</li>
        `;
        loadTutorDashboard();
    } else {
        menuContainer.innerHTML = `
            <li class="menu-item active" onclick="loadGuardianDashboard()"><span>🏠</span> Dashboard</li>
            <li class="menu-item" onclick="loadPostJobForm()"><span>📝</span> Post A Job</li>
            <li class="menu-item" onclick="loadTuitionJobs()"><span>📑</span> Posted Jobs</li>
            <li class="menu-item"><span>💬</span> Tutor Request</li>
            <li class="menu-item"><span>⚙️</span> Settings</li>
        `;
        loadGuardianDashboard();
    }
}

// Render Logged Out View
function renderLoggedOutUI() {
    document.getElementById('auth-actions-logged-out').style.display = 'flex';
    document.getElementById('auth-actions-logged-in').style.display = 'none';
    
    document.getElementById('side-name').innerText = 'Guest User';
    document.getElementById('side-id-label').innerText = 'Please Sign In';

    document.getElementById('menu-items').innerHTML = `
        <li class="menu-item active" onclick="loadTuitionJobs()"><span>🎛️</span> Available Jobs</li>
        <li class="menu-item" onclick="openAuthModal('signin')"><span>🔑</span> Sign In</li>
    `;

    loadTuitionJobs(); // Publicly accessible jobs board
}

// Dropdown & Modal Logic
function toggleUserDropdown() {
    const menu = document.getElementById('user-menu');
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
}

function openAuthModal(mode) {
    currentAuthMode = mode;
    updateAuthModalUI();
    document.getElementById('auth-modal').classList.add('active');
}

function closeAuthModal() {
    document.getElementById('auth-modal').classList.remove('active');
}

function selectLoginRole(role) {
    selectedRole = role;
    document.getElementById('role-parent').classList.remove('active');
    document.getElementById('role-tutor').classList.remove('active');

    if (role === 'guardian') {
        document.getElementById('role-parent').classList.add('active');
    } else {
        document.getElementById('role-tutor').classList.add('active');
    }
}

function toggleAuthMode() {
    currentAuthMode = (currentAuthMode === 'signin') ? 'signup' : 'signin';
    updateAuthModalUI();
}

function updateAuthModalUI() {
    const title = document.querySelector('.auth-header-title');
    const sub = document.querySelector('.auth-sub-title');
    const regFields = document.getElementById('register-fields');
    const forgotLink = document.getElementById('forgot-pass-link');
    const submitBtn = document.getElementById('auth-submit-btn');
    const switchBtn = document.getElementById('auth-switch-btn');

    if (currentAuthMode === 'signin') {
        title.innerHTML = `<span class="green-text">Welcome</span> Back`;
        sub.innerText = `Sign in to Continue your Journey.`;
        regFields.style.display = 'none';
        forgotLink.style.display = 'block';
        submitBtn.innerText = 'Sign In';
        switchBtn.innerText = 'Sign Up';
    } else {
        title.innerHTML = `<span class="green-text">Create</span> Account`;
        sub.innerText = `Join as a ${selectedRole.toUpperCase()} today!`;
        regFields.style.display = 'block';
        forgotLink.style.display = 'none';
        submitBtn.innerText = 'Sign Up';
        switchBtn.innerText = 'Sign In';
    }
}

function togglePasswordVisibility() {
    const input = document.getElementById('auth-password');
    input.type = input.type === 'password' ? 'text' : 'password';
}

// Authentication Submit Handler (Login / Register)
function submitAuthForm() {
    const loginId = document.getElementById('auth-login-id').value.trim();
    const password = document.getElementById('auth-password').value.trim();

    if (!loginId || !password) {
        alert('Please fill in required fields!');
        return;
    }

    if (currentAuthMode === 'signin') {
        fetch('/api/auth/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                login_id: loginId,
                password: password,
                role: selectedRole
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                currentUser = data.user;
                closeAuthModal();
                renderAuthenticatedUI();
            } else {
                alert(data.message);
            }
        });
    } else {
        const name = document.getElementById('auth-name').value.trim();
        const email = document.getElementById('auth-email').value.trim();

        if(!name || !email) {
            alert('Please fill in Name and Email!');
            return;
        }

        fetch('/api/auth/register', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                name: name,
                email: email,
                phone: loginId,
                password: password,
                role: selectedRole
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                currentUser = data.user;
                closeAuthModal();
                renderAuthenticatedUI();
            } else {
                alert(data.message);
            }
        });
    }
}

// Logout Handler
function handleLogout() {
    fetch('/api/auth/logout', { method: 'POST' })
        .then(res => res.json())
        .then(() => {
            currentUser = null;
            renderLoggedOutUI();
        });
}

// --- VIEWS LOGIC ---

function loadTutorDashboard() {
    fetch(`/api/tutor/dashboard/${currentUser.id}`)
        .then(res => res.json())
        .then(data => {
            const m = data.metrics;
            document.getElementById('main-content').innerHTML = `
                <div class="card-box" style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <p style="color:#64748b; font-size:14px;">Good Day,</p>
                        <h1 style="font-size:24px; color:#0f172a;">Welcome to "Tuition Terminal"</h1>
                    </div>
                </div>

                <div class="metrics-grid">
                    <div class="metric-card"><div class="metric-icon-box" style="background:#3b82f6;">📝</div><div><div class="metric-number">${m.applied}</div><div class="metric-label">Applied</div></div></div>
                    <div class="metric-card"><div class="metric-icon-box" style="background:#ec4899;">📌</div><div><div class="metric-number">${m.shortlisted}</div><div class="metric-label">Shortlisted</div></div></div>
                    <div class="metric-card"><div class="metric-icon-box" style="background:#f59e0b;">🤝</div><div><div class="metric-number">${m.appointed}</div><div class="metric-label">Appointed</div></div></div>
                    <div class="metric-card"><div class="metric-icon-box" style="background:#8bc34a;">✔</div><div><div class="metric-number">${m.confirmed}</div><div class="metric-label">Confirmed</div></div></div>
                    <div class="metric-card"><div class="metric-icon-box" style="background:#10b981;">💳</div><div><div class="metric-number">${m.payment}</div><div class="metric-label">Payment</div></div></div>
                    <div class="metric-card"><div class="metric-icon-box" style="background:#ef4444;">✖</div><div><div class="metric-number">${m.canceled}</div><div class="metric-label">Canceled</div></div></div>
                </div>
            `;
        });
}

function loadGuardianDashboard() {
    document.getElementById('main-content').innerHTML = `
        <div class="card-box">
            <h2>Hire A Tutor Today</h2>
            <p style="color:#64748b; font-size:13px; margin-top:5px;">Post your tuition job requirement.</p>
            <button class="btn-black" style="background:#8bc34a; margin-top:12px;" onclick="loadPostJobForm()">Post A Job Now</button>
        </div>
    `;
}

function loadTuitionJobs() {
    const main = document.getElementById('main-content');
    main.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
            <div class="city-filters" style="margin-bottom:0;">
                <button class="chip-btn active" onclick="fetchJobs('All')">All</button>
                <button class="chip-btn" onclick="fetchJobs('Dhaka')">Dhaka</button>
            </div>
        </div>
        <div class="jobs-grid" id="jobs-list">Loading Jobs...</div>
    `;
    fetchJobs('All');
}

function fetchJobs(city) {
    fetch(`/api/tuition-jobs?city=${city}`)
        .then(res => res.json())
        .then(jobs => {
            const container = document.getElementById('jobs-list');
            container.innerHTML = jobs.map(j => `
                <div class="job-card">
                    <div class="job-card-top">
                        <span class="job-title">${j.title}</span>
                        <span style="font-size:12px; font-weight:bold; color:#64748b;">Job ID: ${j.job_id}</span>
                    </div>
                    <div style="font-size:12px; color:#475569;">📍 ${j.location}, ${j.city}</div>
                    <div class="job-details-grid">
                        <div>📚 <b>Subjects:</b> ${j.subjects}</div>
                        <div>💵 <b>Salary:</b> ${j.salary} BDT</div>
                    </div>
                    <button class="btn-black" onclick="handleJobApply()">Apply Now</button>
                </div>
            `).join('');
        });
}

function handleJobApply() {
    if (!currentUser) {
        alert('Please Sign In first to apply for tuition jobs!');
        openAuthModal('signin');
    } else {
        alert('Job Application Sent Successfully!');
    }
}

function loadMyProfile() {
    fetch(`/api/user/profile/${currentUser.id}`)
        .then(res => res.json())
        .then(u => {
            document.getElementById('main-content').innerHTML = `
                <div class="card-box">
                    <h3>User Profile Information</h3>
                    <p style="margin-top:10px;"><b>Name:</b> ${u.name}</p>
                    <p><b>Email:</b> ${u.email || 'N/A'}</p>
                    <p><b>Phone:</b> ${u.phone || 'N/A'}</p>
                    <p><b>Role:</b> ${u.role.toUpperCase()}</p>
                </div>
            `;
        });
}

function loadPostJobForm() {
    if(!currentUser || currentUser.role !== 'guardian') {
        alert('You must be logged in as a Parent to post a job!');
        openAuthModal('signin');
        return;
    }
    document.getElementById('main-content').innerHTML = `
        <div class="card-box" style="max-width:500px;">
            <h2>Post A New Tuition Request</h2>
            <form onsubmit="event.preventDefault(); alert('Job Submitted Successfully!'); loadTuitionJobs();" style="display:flex; flex-direction:column; gap:10px; margin-top:15px;">
                <input type="text" placeholder="Title" required style="padding:10px; border:1px solid #cbd5e1; border-radius:6px;">
                <input type="number" placeholder="Salary BDT" required style="padding:10px; border:1px solid #cbd5e1; border-radius:6px;">
                <button class="btn-black" style="background:#8bc34a;">Submit Job</button>
            </form>
        </div>
    `;
}