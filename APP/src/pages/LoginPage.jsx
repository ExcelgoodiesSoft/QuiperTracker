import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, updatePassword } from "../services/authService";
import companyLogo from "../assets/Quipersoft-logo.jpg"

const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [needsReset, setNeedsReset] = useState(false);
    const [error, setError] = useState("");
    const [newPasswordError, setNewPasswordError] = useState("");
    const navigate = useNavigate();

    const passwordIsStrong = (pwd) => {
        const minLen = pwd.length >= 8;
        const hasNumber = /\d/.test(pwd);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
        return minLen && hasNumber && hasSpecial;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await login(email, password);

        if (!result.success) {
            setError(result.message || "Login failed");
            return;
        }

        const user = result.message;
        if (user.loginStatus === 0) {
            setNeedsReset(true);
            localStorage.setItem("pendingReset", "1");
            setError("");
            return;
        }
        navigate(user.role === "admin" ? "/admin" : "/user");
    };

    const handlePasswordUpdate = async (e) => {
        if (e) e.preventDefault();
        if (!passwordIsStrong(newPassword)) {
            setNewPasswordError("Password must be at least 8 characters and include a number and a special character.");
            return;
        }
        setNewPasswordError("");
        const res = await updatePassword(email, newPassword);
        if (!res.success) {
            setError(res.message || "Password update failed");
            return;
        }
        localStorage.removeItem("pendingReset");
        localStorage.setItem("loggedInUser", JSON.stringify(res.user));
        setNeedsReset(false);
        navigate(res.user.role?.toLowerCase() === "admin" ? "/admin" : "/user");
    };

    useEffect(() => {
        // Landing on login should clear any prior session
        localStorage.removeItem("token");
        localStorage.removeItem("loggedInUser");
        localStorage.removeItem("pendingReset");
        setNeedsReset(false);
    }, []);

    useEffect(() => {
        if (localStorage.getItem("pendingReset") === "1") {
            // page was refreshed during reset mode: clear session, drop flag, and exit reset
            localStorage.removeItem("token");
            localStorage.removeItem("loggedInUser");
            localStorage.removeItem("pendingReset");
            setNeedsReset(false);
        }
    }, []);


    return (
        <div className="container-fluid page p-0">
            <div className="logo">
                <img src={companyLogo} alt="Company Logo" />
            </div>
            <div className="form-box">
                {!needsReset ?
                    (
                        <form onSubmit={handleSubmit}>
                            <h5 className="emailid">Email ID</h5>
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (e.target.value.trim() === "") {
                                        setError("");
                                    }
                                }}
                                required
                                className="mb-3"
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (e.target.value.trim() === "") setError("");
                                }}
                                required
                                className="mb-3"
                            />
                            <button className="btn btn-dark text-white"
                                type="submit"
                                style={
                                    {
                                        width: "30%",
                                        borderRadius: "0"
                                    }
                                }
                            >
                                Sign In
                            </button>
                        </form>) : (
                        <form onSubmit={handlePasswordUpdate} className="mt-4">
                            <h6>Set a new password</h6>
                            <input
                                type="password"
                                placeholder="New password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="mb-2"
                                required
                            />
                            <small className="text-muted d-block mb-2">
                                At least 8 characters, include a number and a special character.
                            </small>
                            {newPasswordError && <small className="text-danger d-block mb-2">{newPasswordError}</small>}
                            <button className="btn btn-dark text-white" type="submit">
                                Update & Continue
                            </button>
                        </form>
                    )
                }
                {error && <p className="text-center text-danger mt-2">{error}</p>}
            </div>
        </div>
    );
};

export default LoginPage;