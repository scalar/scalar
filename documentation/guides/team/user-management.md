# User Management

Everything in Scalar belongs to a **team**. Your docs, registry APIs, SDKs, themes and billing all live on the team, and the people you invite to that team get access to them based on their **role**.

This guide covers how to set up your team, invite people, and choose the right role for each of them.

## Teams

A team is the top-level container in Scalar. When you sign up, we create one for you automatically.

Every team has:

- A **name** and a **slug** (the unique identifier used in URLs)
- A **namespace** used by the [Registry](../registry/getting-started.md)
- A **billing plan** shared by everyone on the team
- A list of **members**, each with a role

You can belong to more than one team, and switch between them from the team switcher in [Settings](https://dashboard.scalar.com/team/settings). This is useful when you separate work by company, client or environment. Keep in mind that members, billing and projects are never shared between teams: a person who needs access to two teams has to be invited to both.

> Every account must belong to at least one team, so you cannot delete your only team.

## Roles and permissions

Scalar uses three roles. Assign the lowest role that still lets someone do their job.

| Role | Best for | Can do |
|------|----------|--------|
| **Owner** | The people responsible for the account | Everything an Admin can do, plus adding and removing other Owners, changing Owner roles, and deleting the team |
| **Admin** | Team leads and API platform owners | Invite and remove members, change roles of non-Owners, manage billing and the plan, and everything an Editor can do |
| **Editor** | Everyone writing docs or shipping APIs | Create, edit and delete docs, APIs, SDKs and themes |

Here is the same information as a permission matrix:

| Permission | Owner | Admin | Editor |
|------------|:-----:|:-----:|:------:|
| Create, edit and delete docs and projects | ✅ | ✅ | ✅ |
| Invite and remove members | ✅ | ✅ | ❌ |
| Change roles below Owner | ✅ | ✅ | ❌ |
| Manage billing and the plan | ✅ | ✅ | ❌ |
| Add, remove or promote Owners | ✅ | ❌ | ❌ |
| Delete the team | ✅ | ❌ | ❌ |

A team must always have at least one Owner. If you are the only Owner, promote somebody else before you remove yourself or leave the team.

## Invite members

You need to be an Owner or an Admin to invite somebody.

1. Go to [Team > Members](https://dashboard.scalar.com/team/members) in the dashboard
2. Click **Invite Member**
3. Enter the email address and pick a role
4. Click **Send Invite**

The invited person receives an email with a link to join your team. Invites are valid for three days. If an invite expires, cancel it and send a new one.

Pending invites appear in the member list marked as **Invite Pending**. To withdraw one, open the menu next to the invite and choose **Cancel Invite**.

> On a paid plan, every member you invite adds a billing seat, and removing a member removes one again. You can see the current seat count above the member list.

## Manage members

All member management happens in [Team > Members](https://dashboard.scalar.com/team/members). Open the menu next to a person to:

- **Change role** — move somebody between Owner, Admin and Editor
- **Remove from team** — revoke their access to the team and free up their billing seat

Owners are listed separately from the rest of the team, so it is always clear who is ultimately responsible for the account.

Removing a member does not delete anything they created. Their docs, APIs and SDKs stay with the team.

### Leave a team

To leave a team yourself, go to [User Settings](https://dashboard.scalar.com/user/profile) and choose **Leave Team** in the Danger Zone. If you are the only Owner of the team, make somebody else an Owner first.

## Restrict who can join

Two enterprise controls help you keep the team limited to your own organization:

- **Domain restrictions** limit invites to email addresses from domains you approve, so an invite to a personal address is rejected before it is sent.
- **[SSO/SAML](../sso/getting-started.md)** connects Scalar to your identity provider, so access follows the same rules as the rest of your company. You can also disable password login so SSO is the only way in.

Both are available on the Enterprise plan. See [pricing](../pricing.md) or email [support@scalar.com](mailto:support@scalar.com) to get started.

## Team members vs. access groups

These two things sound similar, so it is worth being precise:

- **Team members** are the people who build with you inside the Scalar dashboard. They are covered by this guide.
- **[Access groups](../docs/configuration/private-docs.md)** are the people allowed to *read* your private docs. They do not need a seat on your team, and they never see the dashboard.

Use team members for your colleagues, and access groups for customers and partners who should only read your documentation.

## Recommendations

A few things we have seen work well:

- Keep the number of Owners small, but never at one. Two or three is usually right.
- Make team leads Admins so that they can handle invites without waiting on an Owner.
- Default new people to Editor. You can always promote later.
- Review your member list when someone leaves your company, or connect SSO so that offboarding happens automatically.
