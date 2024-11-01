import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../fb';
import logo from '../img/bg2.png';
import { Paper, Badge, IconButton, Avatar } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MailIcon from '@mui/icons-material/Mail';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PersonIcon from '@mui/icons-material/Person';
import LoginIcon from '@mui/icons-material/Login'; 
import StoreIcon from '@mui/icons-material/Store';
import { ref, onValue } from 'firebase/database'; 
import { Explore } from '@mui/icons-material';

const Header = () => {
    const [user] = useAuthState(auth); 
    const [unreadMessages, setUnreadMessages] = useState(0); 

    useEffect(() => {
        if (user) {
            const inboxRef = ref(db, `company/${user.uid}/inbox`); 
            onValue(inboxRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    const unreadCount = Object.values(data).filter(msg => !msg.opened).length;
                    setUnreadMessages(unreadCount);
                }
            });
        }
    }, [user]);

    const handleProfileClick = () => {
        if (user) {
            window.location = '/apx'; 
        } else {
            window.location = '/auth';
        }
    };
    const handleExploreClick = () => {
        window.location = '/feed'; 
    };

    return (
        <header className="bg-white shadow-sm py-4">
            <div className="container mx-auto flex justify-between items-center">
                <Link to="/" className="flex items-center space-x-2">
                    <img src={logo} alt="Logo" style={{width:'70%'}} />
                </Link>
                <div className="flex items-center space-x-4">
                    <IconButton aria-label="explore" onClick={handleExploreClick}>
                        <Explore fontSize="large" />
                    </IconButton>
                    <IconButton aria-label="inbox" component={Link} to="/inbox">
                        <Badge badgeContent={unreadMessages} color="error">
                            <MailIcon fontSize="large" />
                        </Badge>
                    </IconButton>
                    <IconButton aria-label="stores" component={Link} to="/stores">
                        <StoreIcon fontSize="large" />
                    </IconButton>
                </div>
            </div>
        </header>
    );
};

export default Header;
