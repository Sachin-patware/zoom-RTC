import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"]
    },
    password: {
        type: String,
        // Not required — Google users don't have one
        minlength: 6,
        select: false // Never return password by default
    },
    provider: {
        type: String,
        enum: ["local", "google"],
        default: "local"
    },
    googleId: {
        type: String,
        default: null
    },
    avatar_url: {
        type: String,
        default: ""
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    },
    is_verified: {
        type: Boolean,
        default: false
    },
    is_online: {
        type: Boolean,
        default: false
    },
    last_login: {
        type: Date,
        default: null
    },
    // Email verification
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    // Password reset
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    // Refresh token (stored hashed for security)
    refreshToken: {
        type: String,
        select: false
    }
}, { timestamps: true });

// ─── Pre-save: hash password ───────────────────────
userSchema.pre("save", async function(next) {
    if (!this.isModified("password") || !this.password) return next();
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// ─── Instance Methods ──────────────────────────────
userSchema.methods.comparePassword = async function(candidatePassword) {
    if (!this.password) return false;
    return await bcrypt.compare(candidatePassword, this.password);
};

// ─── toJSON: Strip sensitive fields ────────────────
userSchema.methods.toJSON = function() {
    const user = this.toObject();
    delete user.password;
    delete user.refreshToken;
    delete user.emailVerificationToken;
    delete user.emailVerificationExpires;
    delete user.resetPasswordToken;
    delete user.resetPasswordExpires;
    delete user.__v;
    return user;
};

export const User = mongoose.model("User", userSchema);
