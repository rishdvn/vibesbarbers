"use client";

import { useState } from "react";
import { BackgroundGradientAnimation } from "../../_components/background-gradient-animation";
import Login from "../../_components/login";
import Signup from "../../_components/signup";

const LoginPage = () => {
    const [page, setPage] = useState("login");

    const togglePage = () => {
        setPage(page === "login" ? "signup" : "login");
    }

    return ( 
        <div className="bg-gray-50 min-h-screen relative">
            <BackgroundGradientAnimation />
            {page === "login" ? <Login togglePage={togglePage}/> : <Signup togglePage={togglePage}/>}
        </div>
     );
}
 
export default LoginPage;