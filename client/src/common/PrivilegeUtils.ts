import { CurrentUser } from "./CurrentUserProvider";

export function isAdmin(user: CurrentUser) {
    return user.admin;
}

export function isManagerFor(user: CurrentUser, makerspaceID: number) {
    makerspaceID = Number(makerspaceID);
    if (isAdmin(user)) {
        return true;
    }
    return user.manager.includes(makerspaceID);
}

export function isManager(user: CurrentUser) {
    if (isAdmin(user)) {
        return true;
    }
    return user.manager.length > 0;
}

export function isStaffFor(user: CurrentUser, makerspaceID: number) {
    makerspaceID = Number(makerspaceID);
    if (isManagerFor(user, makerspaceID)) {
        return true;
    }

    return user.staff.includes(makerspaceID);
}

export function isStaff(user: CurrentUser) {
    if (isManager(user)) {
        return true;
    }

    return user.staff.length > 0;
}

export function isTrainerFor(user: CurrentUser, equipmentID: number, makerspaceID: number) {
    makerspaceID = Number(makerspaceID);
    equipmentID = Number(equipmentID);
    if (isManagerFor(user, makerspaceID)) {
        return true;
    }

    return user.trainer.includes(equipmentID);
}

export function isOnlyTrainer(user: CurrentUser) {
    if (isStaff(user)) {
        return false;
    }

    return user.trainer.length > 0;
}

export function isManagerOrSelf(user: CurrentUser, targetId: number) {
    if (isManager(user)) {
        return true;
    }

    if (Number(user.id) === Number(targetId)) {
        return true;
    }

    return false;
}

export function isStaffOrSelf(user: CurrentUser, targetId: number) {
    if (isStaff(user)) {
        return true;
    } else if (Number(user.id) === targetId) {
        return true;
    }

    return false;
}