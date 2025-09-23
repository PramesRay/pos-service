import admin from '../app/service/firebase.js';
import employeeService from '../app/service/employee.js';
import { UnauthorizedException } from '../exception/unauthorized.exception.js';
import { NotFoundException } from '../exception/not.found.exception.js';

export const authMiddleware = (req, res, next) => {
  if (!req.headers.authorization) {
    throw new UnauthorizedException("Unauthorized");
  }

  const token = req.headers.authorization.split(' ')[1];
  admin.auth().verifyIdToken(token)
    .then(async(decodedToken) => {
      return employeeService.getOne(decodedToken.uid)
        .then((profile) => {
          req.user = { ...decodedToken, profile };
          console.log('req.user', req.user);
          return next();
        })
        .catch((err) => {
          if (err instanceof NotFoundException) {
            req.user = { ...decodedToken, profile: null };
            return next();
          }
          return next(err);
        });
    })
    .catch((err) => {
      if (err?.code === "auth/id-token-invalid") {
        return next(new UnauthorizedException("Invalid token"));
      }
      if (err?.code === "auth/id-token-expired") {
        return next(new UnauthorizedException("Token expired"));
      }
      return next(new UnauthorizedException("Error verifying token"));
    });
};
