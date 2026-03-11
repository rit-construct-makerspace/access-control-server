/**
 * trainingModuleResolver.ts
 * GraphQL Endpoint Implementations for TrainingModules, and executions for submitting to modules
 */

import * as ModuleRepo from "../repositories/Training/ModuleRepository.js";
import { AccessProgress, AnswerInput } from "../schemas/trainingModuleSchema.js";
import { ApolloContext } from "../context.js";
import { createUnassocaitedAuditLog } from "../repositories/AuditLogs/AuditLogRepository.js";
import { getUsersFullName } from "../repositories/Users/UserRepository.js";
import * as SubmissionRepo from "../repositories/Training/SubmissionRepository.js";
import { MODULE_PASSING_THRESHOLD } from "../constants.js";
import { TrainingModuleItem, TrainingModuleRow } from "../db/tables.js";
import { accessCheckExists, createAccessCheck, hasApprovedAccessCheck } from "../repositories/Equipment/AccessChecksRepository.js";
import { createTrainingHold, getTrainingHoldByUserForModule } from "../repositories/Training/TrainingHoldsRespository.js";
import * as PassedModuleRepo from "../repositories/Training/PassedRepository.js";
import * as TrainingModuleReo from "../repositories/Training/ModuleRepository.js";
import { GraphQLError } from "graphql";

/**
 * IDs of quizzes that will grant access to 3DPrinterOS Workgroups
 * Corresponds 1 to 1 with ID_3DPRINTEROS_QUIZ_WG_MAPPINGS_WORKGROUPS
 */
const ID_3DPRINTEROS_QUIZ_WG_MAPPINGS_QUIZZES: number[] | undefined = process.env.ID_3DPRINTEROS_QUIZ_WG_MAPPINGS_QUIZZES?.split(",")?.map(nstr => Number(nstr))
/**
 * IDs of workgroups that users can be added to
 * Corresponds 1 to 1 with ID_3DPRINTEROS_QUIZ_WG_MAPPINGS_QUIZZES
 */
const ID_3DPRINTEROS_QUIZ_WG_MAPPINGS_WORKGROUPS: number[] | undefined = process.env.ID_3DPRINTEROS_QUIZ_WG_MAPPINGS_WORKGROUPS?.split(",")?.map(nstr => Number(nstr))

/**
 * Add an RIT 3DPrinterOS user to a workgroup
 * @param username the RIT Username of a user to add to a workgroup
 * @param workgroupId the ID of the 3DPrinterOS Workgroup to add to
 * @returns request result body
 */
async function add3DPrinterOSUser(username: string, workgroupId: string) {
  //Login API User
  const options = {
    body: "username=" + process.env.CLOUDPRINT_API_USERNAME + "&password=" + process.env.CLOUDPRINT_API_PASSWORD,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    method: "POST"
  }
  const addRequestBody = await fetch((process.env.CLOUDPRINT_API_URL + "login"), options).then(async function (res) {
    //Currently the compiler will not allow us to parse res.json() since it is typed as 'unknown'
    //To fix this, we will simply lie to the compiler and say it is 'any'
    return await res.json() as any;
  }).then(async function (json) {
    //Add user to workgroups
    const options = {
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
 * Get the workgroup ID associated with a module ID (if available)
 * @param moduleID the module ID to check for
 * @return id of 3dprinteros workgroup to add the user to
 * @return undefined if no associated workgroup
 */
function printerWorkgroupForModule(moduleID: number): number | undefined {
  if (!ID_3DPRINTEROS_QUIZ_WG_MAPPINGS_QUIZZES || !ID_3DPRINTEROS_QUIZ_WG_MAPPINGS_WORKGROUPS) {
    console.warn(`3DPrinterOS-API: No configured mappings of modules to workgroups. Quizzes:'${process.env.ID_3DPRINTEROS_QUIZ_WG_MAPPINGS_QUIZZES}', WGs:'${process.env.ID_3DPRINTEROS_QUIZ_WG_MAPPINGS_WORKGROUPS}'`)
    return undefined
  }
  if (ID_3DPRINTEROS_QUIZ_WG_MAPPINGS_QUIZZES.length != ID_3DPRINTEROS_QUIZ_WG_MAPPINGS_WORKGROUPS.length) {
    console.warn(`3DPrinterOS-API: Length mismatch between quizzes and worgroups. Cant proceed. Quizzes: ${ID_3DPRINTEROS_QUIZ_WG_MAPPINGS_QUIZZES}, WGs: ${ID_3DPRINTEROS_QUIZ_WG_MAPPINGS_WORKGROUPS}`);
    return undefined;
  }
  const index = ID_3DPRINTEROS_QUIZ_WG_MAPPINGS_QUIZZES.indexOf(moduleID);
  return ID_3DPRINTEROS_QUIZ_WG_MAPPINGS_WORKGROUPS[index];
}

/**
 * Summary of a question answer result for display to user of results page
 */
interface ChoiceSummary {
  questionNum: string;
  questionText: string;
  correct: boolean;
  comment: string;
}

/**
 * Delete the correct indicator for each option on each question
 * @param quiz array of TrainingModuleItems involved in a quiz
 */
const removeAnswersFromQuiz = (quiz: TrainingModuleItem[]) => {
  for (const item of quiz) {
    if (item.options) {
      for (const option of item.options) {
        delete option.correct;
      }
    }
  }
};

function countQuizCorrectOptions(quiz: TrainingModuleItem[]) {
  for (const item of quiz) {
    if (item.options) {
      var count = 0;
      for (const option of item.options) {
        if (option.correct == true) {
          count++;
        }
      }
      item.correctAnswers = count;
    }
  }
}

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
      ifAuthenticated(async (_user) => {
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
      ifAuthenticated(async (_user) => {
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
      return ifAuthenticated(async (_user: any) => {
        const modules = await ModuleRepo.getModules();

        for (const module of modules) removeAnswersFromQuiz(module.quiz);

        return modules;
      })
    },

    modulesWithAnswers: async (
      _parent: any,
      _args: any,
      { isStaff }: ApolloContext
    ) => {
      return isStaff(async (_user: any) => {
        const modules = await ModuleRepo.getModules();
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
      return ifAuthenticated(async (_user: any) => {
        const module = await ModuleRepo.getModuleByIDWhereArchived(args.id, false);
        removeAnswersFromQuiz(module.quiz);
        return module;
      })
    },

    moduleWithAnswers: async (
      _parent: any,
      args: { id: number },
      { isStaff }: ApolloContext
    ) => {
      return isStaff(async (_user: any) => {
        const module = await ModuleRepo.getModuleByID(args.id);
        return module;
      })
    },

    /**
     * Finds a module based id of item. No restrictions on user. Only returns # of correct answers for options
     * @argument id ID of TrainingModule
     * @argument itemID id of item within TrainingModule
     * @returns number of correct answers for a question
     */
    moduleWithAnswerCount: async (
      _parent: any,
      args: { id: number, itemID: string },
      { ifAuthenticated }: ApolloContext
    ) => {
      return ifAuthenticated(async (_user: any) => {
        const module = await ModuleRepo.getModuleByID(args.id);
        countQuizCorrectOptions(module.quiz)
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
        const modules = await ModuleRepo.getModulesWhereArchived(true);

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
        const module = await ModuleRepo.getModuleByIDWhereArchived(args.id, true);

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
        const relatedEquipments = await ModuleRepo.getEquipmentsByModuleID(args.sourceTrainingModuleID);
        const accessProgresses: AccessProgress[] = [];

        //asyncs don't work right in .forEach. Use fori
        for (let i = 0; i < relatedEquipments.length; i++) {
          const modules = await ModuleRepo.getModulesByEquipmentID(relatedEquipments[i].id);
          const passedModules: TrainingModuleRow[] = [];
          const availableModules: TrainingModuleRow[] = [];
          for (let x = 0; x < modules.length; x++) {
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
      args: { name: string; quiz: object; makerspaceID: number },
      { isStaff }: ApolloContext
    ) =>
      isStaff(async (user: any) => {
        const module = await ModuleRepo.addModule(
          args.name,
          args.quiz,
          args.makerspaceID,
          true, // default to archived to avoid pollution
        );

        await createUnassocaitedAuditLog(
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

        await createUnassocaitedAuditLog(
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
      { isManager }: ApolloContext
    ) =>
      isManager(async (user: any) => {
        const module = await ModuleRepo.setModuleArchived(Number(args.id), true);

        await createUnassocaitedAuditLog(
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
      { isManager }: ApolloContext
    ) =>
      isManager(async (user: any) => {
        const module = await ModuleRepo.setModuleArchived(Number(args.id), false);

        await createUnassocaitedAuditLog(
          "{user} unarchived the {module} module.",
          "admin",
          { id: user.id, label: getUsersFullName(user) },
          { id: module.id, label: module.name }
        );

        return module;
      }),

    /** Delete a TrainingModule
     * @argument id ID of the TrainingModule to delete
     */
    deleteModule: async (
      _parent: any,
      args: { id: string },
      { isManager }: ApolloContext
    ) => isManager(async (user: any) => {
      const module = await ModuleRepo.getModuleByID(Number(args.id));

      if (!module.archived) {
        throw new GraphQLError("Cannot delete published (non-archived) trainings");
      }

      await createUnassocaitedAuditLog(
        "{user} deleted {module} module.",
        "admin",
        { id: user.id, label: getUsersFullName(user) },
        { id: Number(args.id), label: module.name ?? "undefined" }
      );

      await ModuleRepo.deleteModule(Number(args.id));
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
          const choiceSummary: ChoiceSummary[] = [];

          //Get Questions from quiz
          const questions = module.quiz.filter((i: any) =>
            ["CHECKBOXES", "MULTIPLE_CHOICE"].includes(i.type)
          );

          for (const question of questions) {
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
              choiceSummary.push({ questionNum: question.id, questionText: question.text, correct: true, comment: question.affirmation });
            } else {
              incorrect++;
              choiceSummary.push({ questionNum: question.id, questionText: question.text, correct: false, comment: question.hint });
            }

          }

          //Calculate percentage grade
          const grade = Math.round((correct / (incorrect + correct)) * 100);

          //Insert submission record
          SubmissionRepo.addSubmission(
            user.id,
            Number(args.moduleID),
            grade >= MODULE_PASSING_THRESHOLD,
            JSON.stringify(choiceSummary)
          ).then(async (id) => {
            await createUnassocaitedAuditLog(
              `{user} submitted attempt of {module} with a grade of ${grade} (${correct}/${incorrect + correct}).`,
              "training",
              { id: user.id, label: getUsersFullName(user) },
              { id: Number(args.moduleID), label: module.name }
            );

            //If all trainings for equipment done, add access check for all passed equipment
            if (grade >= MODULE_PASSING_THRESHOLD) {
              const associatedWorgroup = printerWorkgroupForModule(Number(args.moduleID));
              if (associatedWorgroup) {
                add3DPrinterOSUser(user.ritUsername, String(associatedWorgroup)).then(async function (result) {
                  if (result) {
                    await createUnassocaitedAuditLog(
                      `{user} has been automatically added to 3DPrinterOS Workgroup ${associatedWorgroup}.`,
                      "server",
                      { id: user.id, label: getUsersFullName(user) }
                    );
                  } else {
                    await createUnassocaitedAuditLog(
                      `{user} has failed to be added to 3DPrinterOS Workgroup ${associatedWorgroup}. Check server logs.`,
                      "server",
                      { id: user.id, label: getUsersFullName(user) }
                    );
                  }
                });

              } else {
                const equipmentIDsToCheck = await ModuleRepo.getPassedEquipmentIDsByModuleID(Number(args.moduleID), user.id);
                equipmentIDsToCheck.forEach(async equipmentID => {
                  //check if access check does not already exists
                  if (!(await accessCheckExists(user.id, equipmentID))) {
                    await createAccessCheck(user.id, equipmentID).then(async (_result) => {
                      //await createLog(`[DEBUG] access check automatically created for User ${user.id}, Equipment ${equipmentID}`, "server", { id: module.id, label: module.name }, { id: user.id, label: getUsersFullName(user) });
                    });
                  }
                });
              }
            } else {
              //If max daily attempts reached. Create a training hold on this module
              if (Number(process.env.TRAINING_MAX_ATTEMPTS_PER_DAY_BEFORE_LOCK) && (await SubmissionRepo.getFailedSubmissionsTodayByModuleAndUser(Number(args.moduleID), user.id)).length >= Number(process.env.TRAINING_MAX_ATTEMPTS_PER_DAY_BEFORE_LOCK)) {
                await createUnassocaitedAuditLog("Daily attempt limit reached. A hold has been placed on training {module} for {user}", "server", { id: module.id, label: module.name }, { id: user.id, label: getUsersFullName(user) });
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
      args: { userID: number, moduleID: number },
      { isStaffFor }: ApolloContext
    ) => {
      const module = await TrainingModuleReo.getModuleByID(args.moduleID);

      return isStaffFor(module.makerspaceID ?? -1, (_user) => {
        return PassedModuleRepo.deletePassedModule(args.userID, args.moduleID);
      });
    }
  },
};

export default TrainingModuleResolvers;
