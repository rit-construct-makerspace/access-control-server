import { ApolloContext } from "../context.js";
import { Privilege } from "../schemas/usersSchema.js";

/**
 * Fetch 1st page of eventss from EventBrite
 * @returns event listing JSON
 */
async function getEvents() {
  //Login API User
  var options = {
    method: "GET"
  }
  const requestBody = await fetch(((process.env.EVENTBRITE_API_LIST_EVENTS_URL ?? "") + ("?token=" + process.env.EVENTBRITE_API_KEY + "&order_by=start_asc&time_filter=current_future&page_size=15")), options).then(async function (res) {
    //Currently the compiler will not allow us to parse res.json() since it is typed as 'unknown'
    //To fix this, we will simply lie to the compiler and say it is 'any'
    //console.log(res.json());
    return await res.json() as any;
  })
  return requestBody;
}

export const EventsResolver = {
  Query: {
    /**
     * Fetch all events
     * @returns all events
     * @throws GraphQLError if not MAKER or MENTOR or STAFF or is on hold
     */
    events: async (
      _parent: any,
      _args: any,
      { ifAllowed }: ApolloContext
    ) =>
      ifAllowed([Privilege.MAKER, Privilege.MENTOR, Privilege.STAFF], async () => {
        return (await getEvents()).events;
      }),
  }
}