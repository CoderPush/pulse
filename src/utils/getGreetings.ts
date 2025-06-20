export const getGreeting = (userName: string) => {
    const hour = new Date().getHours();
    const day = new Date().getDay();

    const timeOfDay =
        hour < 12 ? "Morning" :
            hour < 17 ? "Afternoon" :
                "Evening";

    const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][day];

    const greeting =
        day === 1 ? `${timeOfDay} ${userName}! ☕ Ready to kick off a new week? I'd love to hear what's on your mind - whether it's exciting projects ahead or just getting back into the flow.` :
            day === 5 ? `${timeOfDay} ${userName}! 🎉 You've made it to Friday! I'm here to help wrap up the week - let's capture how things went, whether it was a week of wins or one of those 'character building' experiences.` :
                `${timeOfDay} ${userName}! 👋 How's your ${dayName} shaping up? I'm here to listen and help you reflect on how things are going.`

    return greeting;
}