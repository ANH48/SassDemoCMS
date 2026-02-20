# Codebase Structure & Coding Standards

This document outlines the codebase organization patterns, coding conventions, and architectural guidelines for the SaaS multi-tenant e-commerce platform.

## File Organization

### File Naming

- Use **kebab-case** for all file names
- Be descriptive; file name should convey purpose at a glance
- Examples:
  - `tenant-provisioner.service.ts` (NestJS service)
  - `jwt-auth.guard.ts` (NestJS guard)
  - `current-user.decorator.ts` (NestJS decorator)
  - `product-table.tsx` (React component)
  - `use-auth-store.ts` (React hook)

### File Size

- **Maximum 200 lines per file** (hard limit)
- Split large files by semantic boundaries:
  - Extract utility functions to separate `utils.ts` files
  - Move reusable logic to dedicated service/hook files
  - Create separate components for complex UI sections

## Directory Structure Patterns

### NestJS Modules

```
src/
└── {module-name}/
    ├── {module-name}.module.ts          # Module definition
    ├── {module-name}.controller.ts      # HTTP routes
    ├── {module-name}.service.ts         # Business logic
    ├── dto/
    │   ├── create-{entity}.dto.ts
    │   ├── update-{entity}.dto.ts
    │   └── query-{entity}.dto.ts
    ├── {entity}.entity.ts               # Entity/response schema (if needed)
    └── {specialized}.service.ts         # e.g., provisioner.service.ts
```

**Guidelines:**
- One class per file
- DTOs for request/response validation
- Services handle business logic, not controllers
- Controllers only coordinate request → service → response

### Next.js Pages (App Router)

```
app/
├── (auth)/
│   ├── layout.tsx
│   └── login/page.tsx
├── (dashboard)/
│   ├── layout.tsx
│   ├── page.tsx                        # Dashboard home
│   └── {resource}/
│       ├── page.tsx                    # List view
│       ├── [id]/page.tsx               # Detail view
│       └── new/page.tsx                # Create form
└── api/
    └── {route}/route.ts
```

**Guidelines:**
- Use route groups `(name)` for layout organization
- Colocate components near where they're used
- Extract reusable components to `components/` only if used in multiple places

### React Components

```
components/
├── common/                             # Shared UI elements
│   ├── header.tsx
│   ├── sidebar.tsx
│   └── pagination.tsx
├── forms/                              # Form components
│   ├── product-form.tsx
│   └── customer-form.tsx
├── tables/                             # Table/list components
│   ├── products-table.tsx
│   └── orders-table.tsx
└── layout/                             # Layout wrappers
    ├── dashboard-layout.tsx
    └── auth-layout.tsx
```

## TypeScript Conventions

### Strict Mode

- Enable `"strict": true` in `tsconfig.json`
- All files must compile with zero TypeScript errors
- No `any` types; use `unknown` if needed, then narrow

### Interfaces vs Types

```typescript
// Use interfaces for object shapes (contracts)
interface User {
  id: string;
  email: string;
  role: UserRole;
}

// Use types for unions, primitives, tuples
type UserRole = 'ADMIN' | 'USER' | 'GUEST';
type ApiResponse<T> = { data: T; status: number };
```

### Enums vs Union Types

```typescript
// Use enums for fixed sets (serializable)
enum TenantStatus {
  PROVISIONING = 'PROVISIONING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

// Use string unions for string literals
type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED';
```

## Import Organization

```typescript
// 1. External packages
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

// 2. Internal packages
import { GLOBAL_CLIENT } from '@repo/database';
import type { JwtPayload } from '@repo/types';
import { ApiResponse } from '@repo/types';

// 3. Relative imports
import { logger } from '../utils/logger';
import type { CreateTenantDto } from './dto/create-tenant.dto';
```

## NestJS Patterns

### Modules

```typescript
@Module({
  providers: [TenantsService],
  controllers: [TenantsController],
  exports: [TenantsService],           // Export for other modules
})
export class TenantsModule {}
```

### Guards (Authorization)

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    return super.canActivate(context);
  }
}
```

**Guard chain order (important):**
```typescript
@UseGuards(JwtAuthGuard, RolesGuard, TenantContextGuard)
```

### Decorators (Custom)

```typescript
export const Roles = (...roles: UserRole[]): MethodDecorator => {
  return SetMetadata('roles', roles);
};

// Usage
@Roles('GLOBAL_ADMIN')
@Get()
getAllTenants() { }
```

### Pipes (Validation)

```typescript
// Global pipe in AppModule
app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

// DTO with class-validator
export class CreateTenantDto {
  @IsString()
  @Length(3, 50)
  name: string;
}
```

### Exception Filters (Error Handling)

```typescript
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    const status = exception.getStatus?.() || 500;
    response.status(status).json({
      statusCode: status,
      message: exception.message,
      timestamp: new Date(),
    });
  }
}
```

## Prisma Patterns

### Service Wrapping

```typescript
@Injectable()
export class ProductsService {
  constructor(@Inject(TENANT_PRISMA) private prisma: PrismaClient) {}

  async create(tenantPrisma: PrismaClient, data: CreateProductDto) {
    return tenantPrisma.product.create({ data });
  }
}
```

### Transaction Handling

```typescript
await prisma.$transaction(async (tx) => {
  await tx.order.create({ data: orderData });
  await tx.orderItem.createMany({ data: itemsData });
});
```

### Connection Management

- Services receive injected PrismaClient
- Never create PrismaClient directly in services
- Use TenantPrismaManager for multi-tenant scenarios

## React Patterns

### Server Components (Default)

```typescript
// app/products/page.tsx (Server Component by default)
export default async function ProductsPage() {
  const products = await fetchProducts();
  return <ProductsList products={products} />;
}
```

### Client Components (Explicit)

```typescript
// components/product-form.tsx
'use client';

import { useActionState } from 'react';

export function ProductForm() {
  const [state, formAction] = useActionState(createProduct, null);
  return <form action={formAction}>{/* ... */}</form>;
}
```

### Form Handling

```typescript
'use client';

export function CreateTenantForm() {
  const [state, formAction, isPending] = useActionState(
    createTenantAction,
    { success: false, error: null }
  );

  return (
    <form action={formAction}>
      <input name="name" required />
      <button disabled={isPending}>Create</button>
    </form>
  );
}
```

### Custom Hooks

```typescript
// hooks/use-auth.ts
export function useAuth() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    // Fetch current user
  }, []);
  return { user };
}
```

## Testing Conventions

### File Naming & Location

| Type | Pattern | Location |
|------|---------|----------|
| Unit | `name.spec.ts` | Next to source file |
| Integration | `name.e2e-spec.ts` | `src/__tests__/` |
| End-to-end | `name.e2e.ts` | `e2e/` |

### Unit Tests

```typescript
// products.service.spec.ts
describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: PrismaClient;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ProductsService],
    }).compile();
    service = module.get(ProductsService);
  });

  it('should create a product', async () => {
    const result = await service.create({ name: 'Test' });
    expect(result).toHaveProperty('id');
  });
});
```

### Testing Strategy

- Write tests alongside implementation (not deferred)
- Aim for >80% code coverage
- Mock external dependencies (databases, APIs)
- Test happy path + error scenarios
- Phase 6 focuses on integration/E2E tests

## Git Conventions

### Commit Messages

Use **conventional commits** format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:** `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

**Examples:**
```
feat(auth): implement jwt strategy for global admin
fix(provisioning): handle database creation timeout
docs(architecture): update tenant provisioning flow
test(products): add unit tests for product service
```

### Branch Naming

```
feature/tenant-provisioning
bugfix/auth-token-expiry
docs/update-architecture
```

## Environment Variables

### Source of Truth

- `.env.example` documents all required variables with descriptions
- Never commit actual `.env` file
- Local development: Copy `.env.example` to `.env` and fill in values

### Example .env.example

```
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/saas_global
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=change-me-in-production
JWT_EXPIRES_IN=1h

# Admin
GLOBAL_ADMIN_EMAIL=admin@platform.com
GLOBAL_ADMIN_PASSWORD=admin123
```

## Error Handling

### NestJS Services

```typescript
async createTenant(dto: CreateTenantDto) {
  try {
    return await this.prisma.tenant.create({ data: dto });
  } catch (error) {
    if (error.code === 'P2002') {
      throw new BadRequestException('Tenant slug already exists');
    }
    throw new InternalServerErrorException('Failed to create tenant');
  }
}
```

### Exception Filters

```typescript
// All HTTP errors use standard exception filters
throw new NotFoundException('Tenant not found');
throw new BadRequestException('Invalid input');
throw new UnauthorizedException('Invalid credentials');
throw new ForbiddenException('Access denied');
```

### React Error Boundaries

```typescript
'use client';

export class ErrorBoundary extends React.Component {
  render() {
    if (this.state.hasError) {
      return <div>Something went wrong. Please refresh.</div>;
    }
    return this.props.children;
  }
}
```

## Code Quality Checklist

Before committing, ensure:

- [ ] No syntax errors (TypeScript compiles)
- [ ] File size < 200 lines
- [ ] Imports organized: external → internal → relative
- [ ] No unused imports or variables
- [ ] DTOs/types properly defined
- [ ] Error handling present (try/catch or exception filters)
- [ ] Security checks in place (guards, validation)
- [ ] Tests written for new logic
- [ ] Commit message follows conventions
- [ ] No secrets committed (.env, API keys)
