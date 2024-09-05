// @ts-nocheck
export async function load({ parent }) {
    const { EventTableResult } = await parent()
    let events = []
    EventTableResult.map((arr) => {
        let object = {
            eventName: arr.Event.name,
            event_Id:  arr.Event.id
        };
        // console.log(arr.Event.name);
        events = [...events, object];
    })
    // console.log(events);
    return { events };
}