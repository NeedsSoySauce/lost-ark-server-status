export const error = (message: string) => {
    throw Error(message);
};

export const getEnvironmentVariable = (name: string) =>
    process.env[name] ?? error(`No environment variable with name ${name} was found`);

export const getNumberEnvironmentVariable = (name: string) => {
    const value = getEnvironmentVariable(name);
    return value ? Number(value) : null;
}