import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

// Interface for User document
export interface IUser extends Document {
    username: string;
    email: string;
    password: string;
    createdAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

// Interface for User model statics (unused now)
export interface IUserModel extends Model<IUser> {}

const UserSchema: Schema<IUser> = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/.+@.+\..+/, 'Please fill a valid email address'],
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Hash password before saving
UserSchema.pre<IUser>('save', async function(next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error: any) {
        next(error);
    }
});

// Compare candidate password with stored hash
UserSchema.methods.comparePassword = function(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model<IUser, IUserModel>('User', UserSchema);
export default User;