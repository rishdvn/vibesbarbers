"use client";

import { useState } from "react";
import SmsLogin from "../../_components/sms";

const LoginPage = () => {
    return ( 
        <div className="min-h-screen bg-black flex items-center justify-center">
            <SmsLogin />
        </div>
     );
}
 
export default LoginPage;