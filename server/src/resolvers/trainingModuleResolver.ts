/**
 * trainingModuleResolver.ts
 * GraphQL Endpoint Implementations for TrainingModules, and executions for submitting to modules
 */

import * as ModuleRepo from "../repositories/Training/ModuleRepository.js";
import { AccessProgress, AnswerInput } from "../schemas/trainingModuleSchema.js";
import { ApolloContext } from "../context.js";
import { Privilege } from "../schemas/usersSchema.js";
import { createLog } from "../repositories/AuditLogs/AuditLogRepository.js";
import { getUsersFullName } from "../repositories/Users/UserRepository.js";
import * as SubmissionRepo from "../repositories/Training/SubmissionRepository.js";
import { MODULE_PASSING_THRESHOLD } from "../constants.js";
import { EquipmentRow, TrainingModuleItem, TrainingModuleRow } from "../db/tables.js";
import * as EquipmentRepo from "../repositories/Equipment/EquipmentRepository.js";
import { accessCheckExists, createAccessCheck, hasApprovedAccessCheck } from "../repositories/Equipment/AccessChecksRepository.js";
import fetch from "node-fetch";
import { createTrainingHold, getTrainingHoldByUserForModule } from "../repositories/Training/TrainingHoldsRespository.js";
import * as PassedModuleRepo from "../repositories/Training/PassedRepository.js";
import * as TrainingModuleReo from "../repositories/Training/ModuleRepository.js";

/**
 * The ID of the quiz that, on pass, will grant 3DPrinterOS Self-Service access
 */
const ID_3DPRINTEROS_QUIZ = Number(process.env.ID_3DPRINTEROS_QUIZ);

/**
 * The ID of the quiz that, on pass, will grant 3DPrinterOS Full-Service access
 */
const ID_3DPRINTEROS_FS_QUIZ = Number(process.env.ID_3DPRINTEROS_FS_QUIZ);

/**
 * Add an RIT 3DPrinterOS user to a workgroup
 * @param username the RIT Username of a user to add to a workgroup
 * @param workgroupId the ID of the 3DPrinterOS Workgroup to add to
 * @returns request result body
 */
async function add3DPrinterOSUser(username: string, workgroupId: string) {
  //Login API User
  var options = {
    body: "username=" + process.env.CLOUDPRINT_API_USERNAME + "&password=" + process.env.CLOUDPRINT_API_PASSWORD,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    method: "POST"
  }
  const addRequestBody = await fetch((process.env.CLOUDPRINT_API_URL + "login"), options).then(async function (res) {
    //Currently the compiler will not allow us to parse res.json() since it is typed as 'unknown'
    //To fix this, we will simply lie to the compiler and say it is 'any'
    //console.log(res.json());
    return await res.json() as any;
  }).then(async function (json) {
    //Add user to workgroups
    var options = {
      body: "session=" + json.message.session + "&workgroup_id=" + workgroupId + "&email=" + username + "@rit.edu",
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      method: "POST"
    }
    return await fetch((process.env.CLOUDPRINT_API_URL + "add_user_to_workgroup"), options)
      .then(function (res) {
        return res.json() as any;
      }).then(async function (res) {
        return res;
      });
  });
  return addRequestBody.result;
}

/**
 * Summary of a question answer result for display to user of results page
 */
interface ChoiceSummary {
  questionNum: string;
  questionText: string;
  correct: boolean;
}

/**
 * Delete the correct indicator for each option on each question
 * @param quiz array of TrainingModuleItems involved in a quiz
 */
const removeAnswersFromQuiz = (quiz: TrainingModuleItem[]) => {
  for (let item of quiz) {
    if (item.options) {
      for (let option of item.options) {
        delete option.correct;
      }
    }
  }
};

/**
 * Determine if an array of submitted options for a question is correct
 * @param correct array of correct option IDs
 * @param submitted array of submitted option IDs
 * @returns true if arrays are matching
 */
function submittedOptionIDsCorrect(
  correct: string[],
  submitted: string[] | undefined
) {
  if (!submitted || correct.length !== submitted.length) return false;

  for (let i = 0; i < correct.length; i++) {
    if (!correct.includes(submitted[i])) return false;
  }

  return true;
}

const TrainingModuleResolvers = {
  TrainingModule: {
    //Map equipment field to Equipment
    equipment: async (
      parent: TrainingModuleRow,
      _: any,
      { ifAuthenticated }: ApolloContext
    ) =>
      ifAuthenticated(async (user) => {
        return ModuleRepo.getEquipmentsByModuleID(parent.id);
      }),

    //Set isLocked field  to true if there is a training hold for the requesting user on the parent TrainingModule
    isLocked: async (
      parent: TrainingModuleRow,
      _: any,
      { ifAuthenticated }: ApolloContext
    ) =>
      ifAuthenticated(async (user) => {
        return (await getTrainingHoldByUserForModule(user.id, parent.id)) != undefined
      }),

  },

  AccessProgress: {
    //Map equipment filed to Equipment
    equipment: async (
      parent: AccessProgress,
      _: any,
      { ifAuthenticated }: ApolloContext
    ) =>
      ifAuthenticated(async (user) => {
        return parent.equipment;
      })
  },

  Query: {
    /**
     * Fetch all TrainingModules. If requesting user is a MAKER, question option correct values are stripped
     * @returns array of TrainingModules
     * @throws GraphQLError if not MAKER, MENTOR, or STAFF or is on hold
     */
    modules: async (
      _parent: any,
      _args: any,
      { ifAuthenticated }: ApolloContext
    ) => {
      return ifAuthenticated(async (user: any) => {
        let modules = await ModuleRepo.getModules();

        for (let module of modules) removeAnswersFromQuiz(module.quiz);

        return modules;
      })
    },

    modulesWithAnswers: async (
      _parent: any,
      _args: any,
      { isStaff }: ApolloContext
    ) => {
      return isStaff(async (user: any) => {
        let modules = await ModuleRepo.getModules();
        return modules;
      })
    },

    /**
     * Fetch a TrainingModule by ID. If requesting user is a MAKER, question option correct values are stripped
     * @argument id ID of TrainingModule
     * @returns TrainingModule
     * @throws GraphQLError if not MAKER, MENTOR, or STAFF or is on hold
     */
    module: async (
      _parent: any,
      args: { id: number },
      { ifAuthenticated }: ApolloContext
    ) => {
      return ifAuthenticated(async (user: any) => {
        let module = await ModuleRepo.getModuleByIDWhereArchived(args.id, false);
        removeAnswersFromQuiz(module.quiz);
        return module;
      })
    },

    moduleWithAnswers: async (
      _parent: any,
      args: { id: number },
      { isStaff }: ApolloContext
    ) => {
      return isStaff(async (user: any) => {
        let module = await ModuleRepo.getModuleByIDWhereArchived(args.id, false);
        return module;
      })
    },

    /**
     * Fetch all archived TrainingModules
     * @returns TrainingModule
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     */
    archivedModules: async (
      _parent: any,
      _args: any,
      { isStaff }: ApolloContext
    ) =>
      isStaff(async (_user) => {
        let modules = await ModuleRepo.getModulesWhereArchived(true);

        return modules;
      }),

    /**
     * Fetch an archived TrainingModule by ID
     * @argument id ID of TrainingModule
     * @returns TrainingModule
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     */
    archivedModule: async (
      _parent: any,
      args: { id: number },
      { isStaff }: ApolloContext
    ) =>
      isStaff(async (_user) => {
        let module = await ModuleRepo.getModuleByIDWhereArchived(args.id, true);

        return module;
      }),

    /**
     * Fetch an array of AccessProgress items representing progress on gaining access to all equipment relating to the noted TrainingModule
     * @argument sourceTrainingModuleID ID of TrainingModule to source from
     * @returns array of AccessProgress
     * @throws GraphQLError if not authenticated or is on hold
     */
    relatedAccessProgress: async (
      _parent: any,
      args: { sourceTrainingModuleID: number },
      { ifAuthenticated }: ApolloContext
    ) =>
      ifAuthenticated(async (user) => {
        var relatedEquipments = await ModuleRepo.getEquipmentsByModuleID(args.sourceTrainingModuleID);
        var accessProgresses: AccessProgress[] = [];

        //asyncs don't work right in .forEach. Use fori
        for (var i = 0; i < relatedEquipments.length; i++) {
          const modules = await ModuleRepo.getModulesByEquipmentID(relatedEquipments[i].id);
          const passedModules: TrainingModuleRow[] = [];
          const availableModules: TrainingModuleRow[] = [];
          for (var x = 0; x < modules.length; x++) {
            if (await ModuleRepo.hasPassedModule(user.id, modules[x].id)) {
              passedModules.push(modules[x]);
            } else {
              availableModules.push(modules[x]);
            }
          }
          const accessCheckDone = await hasApprovedAccessCheck(user.id, relatedEquipments[i].id);
          accessProgresses.push({ equipment: relatedEquipments[i], passedModules, availableModules, accessCheckDone: accessCheckDone ?? false });
        }

        return accessProgresses;
      })
  },


  Mutation: {
    /**
     * Create a TrainingModule
     * @argument name Module Name
     * @argument quiz JSON array of quiz items
     * @returns TrainingModule new TrainingModule
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     */
    createModule: async (
      _parent: any,
      args: { name: string; quiz: object },
      { isStaff }: ApolloContext
    ) =>
      isStaff(async (user: any) => {
        const module = await ModuleRepo.addModule(
          args.name,
          args.quiz
        );

        await createLog(
          "{user} created the {module} module.",
          "admin",
          { id: user.id, label: getUsersFullName(user) },
          { id: module.id, label: module.name }
        );

        return module;
      }),

    /**
     * Modify a TrainingModule
     * @argument id ID of TrainingModule to modify
     * @argument name Module Name
     * @argument quiz JSON array of quiz items
     * @argument reservationPrompt DEPRECATED
     * @returns TrainingModule updated TrainingModule
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     */
    updateModule: async (
      _parent: any,
      args: { id: string; name: string; quiz: object; reservationPrompt?: object; makerspaceID: number },
      { isStaff }: ApolloContext
    ) =>
      isStaff(async (user: any) => {
        const module = await ModuleRepo.updateModule(
          Number(args.id),
          args.name,
          args.quiz,
          args.reservationPrompt ?? { "promptText": "Make reservation", "enabled": false },
          args.makerspaceID,
        );

        await createLog(
          "{user} updated the {module} module.",
          "admin",
          { id: user.id, label: getUsersFullName(user) },
          { id: module.id, label: module.name }
        );
      }),

    /**
     * Mark a TrainingModule as Archived
     * @argument id ID of TrainingModule to modify
     * @returns TrainingModule updated TrainingModule
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     */
    archiveModule: async (
      _parent: any,
      args: { id: string },
      { isStaff }: ApolloContext
    ) =>
      isStaff(async (user: any) => {
        const module = await ModuleRepo.setModuleArchived(Number(args.id), true);

        await createLog(
          "{user} archived the {module} module.",
          "admin",
          { id: user.id, label: getUsersFullName(user) },
          { id: module.id, label: module.name }
        );

        return module;
      }),

    /**
     * Mark a TrainingModule as Not Archived
     * @argument id ID of TrainingModule to modify
     * @returns TrainingModule updated TrainingModule
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     */
    publishModule: async (
      _parent: any,
      args: { id: string },
      { isStaff }: ApolloContext
    ) =>
      isStaff(async (user: any) => {
        const module = await ModuleRepo.setModuleArchived(Number(args.id), false);

        await createLog(
          "{user} unarchived the {module} module.",
          "admin",
          { id: user.id, label: getUsersFullName(user) },
          { id: module.id, label: module.name }
        );

        return module;
      }),

    /**
     * Calculate submission grade and create a TrainingSubmission
     * @argument moduleID ID of TrainingModule the submission is for
     * @argument answerSheet array of AnswerInput: user answers
     * @returns submission id
     * @throws GraphQLError if not MENTOR or STAFF or is on hold
     */
    submitModule: async (
      _parent: any,
      args: { moduleID: string; answerSheet: AnswerInput[] },
      { ifAuthenticated }: ApolloContext
    ) => {
      return ifAuthenticated(
        async (user: any) => {
          //Prevent submission if user has a Training Hold on this training
          if (await getTrainingHoldByUserForModule(user.id, Number(args.moduleID))) throw Error(`Active Training Hold on this Module.`)

          const module = await ModuleRepo.getModuleByIDWhereArchived(Number(args.moduleID), false);

          //Prevent if module is not MAKER accessible
          if (!module || module.archived) {
            throw Error(`Cannot access module #${args.moduleID}`);
          }

          //Prevent if module has no questions
          if (module.quiz.length === 0) {
            throw Error("Provided module has no questions");
          }

          //Number of correct questions
          let correct = 0;

          //Number of incorrect questions
          let incorrect = 0;

          //Summary of options chosen
          var choiceSummary: ChoiceSummary[] = [];

          //Get Questions from quiz
          const questions = module.quiz.filter((i: any) =>
            ["CHECKBOXES", "MULTIPLE_CHOICE"].includes(i.type)
          );

          for (let question of questions) {

            //Stop if question has no options (invalid format)
            if (!question.options)
              throw Error(
                `Module Item ${question.id} of type ${question.type} has no options`
              );

            //Get the correct options
            const correctOptionIDs = question.options
              .filter((o: any) => o.correct)
              .map((o: any) => o.id);

            //Get the user-submitted options
            const submittedOptionIDs = args.answerSheet.find(
              (item) => item.itemID === question.id
            )?.optionIDs;

            //Increment correcct if submitted options match correct options (order doesn't matter)
            //Increment incorrect otherwise
            if (submittedOptionIDsCorrect(correctOptionIDs, submittedOptionIDs)) {
              correct++;
              choiceSummary.push({ questionNum: question.id, questionText: question.text, correct: true });
            } else {
              incorrect++;
              choiceSummary.push({ questionNum: question.id, questionText: question.text, correct: false });
            }

          }

          //Calculate percentage grade
          const grade = (correct / (incorrect + correct)) * 100;

          //Insert submission record
          SubmissionRepo.addSubmission(
            user.id,
            Number(args.moduleID),
            grade >= MODULE_PASSING_THRESHOLD,
            JSON.stringify(choiceSummary)
          ).then(async (id) => {
            await createLog(
              `{user} submitted attempt of {module} with a grade of ${grade}.`,
              "training",
              { id: user.id, label: getUsersFullName(user) },
              { id: args.moduleID, label: module.name }
            );

            //If all trainings for equipment done, add access check for all passed equipment
            if (grade >= MODULE_PASSING_THRESHOLD) {
              if (Number(args.moduleID) === ID_3DPRINTEROS_QUIZ) {
                //If 3D Printer Training, add them to the workgroup instead of using an access check
                add3DPrinterOSUser(user.ritUsername, process.env.CLOUDPRINT_API_WORKGROUP ?? "").then(async function (result) {
                  if (result) {
                    await createLog(
                      `{user} has been automatically added to 3DPrinterOS Workgroup ${process.env.CLOUDPRINT_API_WORKGROUP}.`,
                      "server",
                      { id: user.id, label: getUsersFullName(user) }
                    );
                  } else {
                    await createLog(
                      `{user} has failed to be added to 3DPrinterOS Workgroup ${process.env.CLOUDPRINT_API_WORKGROUP}. Check server logs.`,
                      "server",
                      { id: user.id, label: getUsersFullName(user) }
                    );
                  }
                });
              }
              else if (Number(args.moduleID) === ID_3DPRINTEROS_FS_QUIZ) {
                //If 3D Printer Full Service Training, add them to the workgroup instead of using an access check
                add3DPrinterOSUser(user.ritUsername, process.env.CLOUDPRINT_API_FS_WORKGROUP ?? "").then(async function (result) {
                  if (result) {
                    await createLog(
                      `{user} has been automatically added to 3DPrinterOS Workgroup ${process.env.CLOUDPRINT_API_FS_WORKGROUP}.`,
                      "server",
                      { id: user.id, label: getUsersFullName(user) }
                    );
                  } else {
                    await createLog(
                      `{user} has failed to be added to 3DPrinterOS Workgroup ${process.env.CLOUDPRINT_API_FS_WORKGROUP}. Check server logs.`,
                      "server",
                      { id: user.id, label: getUsersFullName(user) }
                    );
                  }
                });
              }
              else {
                const equipmentIDsToCheck = await ModuleRepo.getPassedEquipmentIDsByModuleID(Number(args.moduleID), user.id);
                equipmentIDsToCheck.forEach(async equipmentID => {
                  //check if access check does not already exists
                  if (!(await accessCheckExists(user.id, equipmentID))) {
                    await createAccessCheck(user.id, equipmentID).then(async result => {
                      //await createLog(`[DEBUG] access check automatically created for User ${user.id}, Equipment ${equipmentID}`, "server", { id: module.id, label: module.name }, { id: user.id, label: getUsersFullName(user) });
                    });
                  }
                });
              }
            } else {
              //If max daily attempts reached. Create a training hold on this module
              if (Number(process.env.TRAINING_MAX_ATTEMPTS_PER_DAY_BEFORE_LOCK) && (await SubmissionRepo.getFailedSubmissionsTodayByModuleAndUser(Number(args.moduleID), user.id)).length >= Number(process.env.TRAINING_MAX_ATTEMPTS_PER_DAY_BEFORE_LOCK)) {
                await createLog("Daily attempt limit reached. A hold has been placed on training {module} for {user}", "server", { id: module.id, label: module.name }, { id: user.id, label: getUsersFullName(user) });
                await createTrainingHold(user.id, Number(args.moduleID));
              }
            }

            return id;
          });
        }
      );
    },

    deletePassedModule: async (
      _parent: any,
      args: {userID: number, moduleID: number},
      { isStaffFor }: ApolloContext
    ) => {
      const module = await TrainingModuleReo.getModuleByID(args.moduleID);

      return isStaffFor(module.makerspaceID ?? -1, (user) => {
        return PassedModuleRepo.deletePassedModule(args.userID, args.moduleID);
      });
    }
  },
};

export default TrainingModuleResolvers;
