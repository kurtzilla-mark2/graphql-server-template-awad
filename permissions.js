import indexOf from 'lodash/indexOf';

const createResolver = resolver => {
  const baseResolver = resolver;
  baseResolver.createResolver = childResolver => {
    const newResolver = async (parent, args, context) => {
      await resolver(parent, args, context);
      return childResolver(parent, args, context);
    };
    return createResolver(newResolver);
  };
  return baseResolver;
};

export const requiresAuth = createResolver((parent, args, context) => {
  console.log('USER', context.user);
  if (!context.user || !context.user.id) {
    throw new Error('Authentication is required');
  }
});

export const requiresAdmin = requiresAuth.createResolver(
  (parent, args, context) => {
    if (!context.user.isAdmin) {
      throw new Error('Requires Admin access');
    }
  }
);

// an example of how we could keep going down this route of chaining resolvers
export const bannedUsernameCheck = requiresAdmin.createResolver(
  (parent, args, context) => {
    if (indexOf(['bob', 'name', 'list'], context.user.username) > -1) {
      throw new Error('That user is not allowed');
    }
  }
);
