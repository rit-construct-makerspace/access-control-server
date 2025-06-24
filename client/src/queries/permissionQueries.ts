import { gql } from "graphql-tag";

/**
 * @param userID id of user to change
 * @param admin boolean of wheather the user is an admin
 * @returns boolean for target user's admin state
 */
export const SET_USER_ADMIN = gql`
    mutation SetUserAdmin($userID: ID!, $admin: Boolean) {
        setUserAdmin(userID: $userID, admin: $admin)
    }
`;

/**
 * @param userID id of the user to make a manager
 * @param makerspaceID id of the makerspace to grant access to
 * @returns an array of IDs of makerspaces this user is a manager for
 */
export const MAKE_USER_MANAGER = gql`
    mutation MakeUserManager($userID: ID!, $makerspaceID: ID!) {
        makeUserManager(userID: $userID, makerspaceID: $makerspaceID)
    }
`;

/**
 * @param userID id of the user to make a manager
 * @param makerspaceID id of the makerspace to revoke access to
 * @returns an array of IDs of makerspaces this user is a manager for
 */
export const REVOKE_USER_MANAGER = gql`
    mutation RevokeUserManager($userID: ID!, $makerspaceID: ID!) {
        revokeUserManager(userID: $userID, makerspaceID: $makerspaceID)
    }
`;

/**
 * @param userID id of the user to make staff
 * @param makerspaceID id of the makerspace to grant access to
 * @returns an array of IDs of makerspaces this user is staff for
 */
export const MAKE_USER_STAFF = gql`
    mutation MakeUserStaff($userID: ID!, $makerspaceID: ID!) {
        makeUserStaff(userID: $userID, makerspaceID: $makerspaceID)
    }
`;

/**
 * @param userID id of the user to make staff
 * @param makerspaceID id of the makerspace to revoke access to
 * @returns an array of IDs of makerspaces this user is staff for
 */
export const REVOKE_USER_STAFF = gql`
    mutation RevokeUserStaff($userID: ID!, $makerspaceID: ID!) {
        revokeUserStaff(userID: $userID, makerspaceID: $makerspaceID)
    }
`;

/**
 * 
 */
export const MAKE_USER_TRAINER = gql`
    mutation MakeUserTrainer($userID: ID!, $equipmentID: ID!) {
        makeUserTrainer(userID: $userID, equipmentID: $equipmentID)
    }
`;

/**
 * 
 */
export const REVOKE_USER_TRAINER = gql`
    mutation revokeUserTrainer($userID: ID!, $equipmentID: ID!) {
        revokeUserTrainer(userID: $userID, equipmentID: $equipmentID)
    }
`;