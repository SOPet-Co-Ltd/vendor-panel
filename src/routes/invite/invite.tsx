import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Heading, Hint, Input, Text, toast } from '@medusajs/ui';
import i18n from 'i18next';
import { AnimatePresence, motion } from 'motion/react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import * as z from 'zod';

import { Form } from '../../components/common/form';
import AvatarBox from '../../components/common/logo-box/avatar-box';
import { useSignUpForInvite } from '../../hooks/api/auth';
import { useAcceptInvite } from '../../hooks/api/invites';
import { fetchQuery } from '../../lib/client';
import { isFetchError } from '../../lib/is-fetch-error';

const CreateAccountSchema = z
  .object({
    first_name: z.string().trim().min(1),
    last_name: z.string().trim().min(1),
    password: z.string().trim().min(1),
    repeat_password: z.string().trim().min(1)
  })
  .superRefine(({ password, repeat_password }, ctx) => {
    if (password !== repeat_password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: i18n.t('invite.passwordMismatch'),
        path: ['repeat_password']
      });
    }
  });

export const Invite = () => {
  const [searchParams] = useSearchParams();
  const [success, setSuccess] = useState(false);
  const [inviteEmail, setInviteEmail] = useState<string | null>(null);
  const [inviteStatus, setInviteStatus] = useState<'loading' | 'valid' | 'invalid'>('loading');

  const token = searchParams.get('token') || null;
  const encryptedEmail = searchParams.get('e') || undefined;

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!token) {
        setInviteStatus('invalid');
        setInviteEmail(null);
        return;
      }

      setInviteStatus('loading');
      setInviteEmail(null);

      try {
        const result = await fetchQuery('/auth/invites/preview', {
          method: 'POST',
          body: { token, e: encryptedEmail }
        });

        const email = (result as any)?.email;
        if (!cancelled && typeof email === 'string' && email.length > 0) {
          setInviteEmail(email);
          setInviteStatus('valid');
        } else if (!cancelled) {
          setInviteStatus('invalid');
        }
      } catch {
        if (!cancelled) {
          setInviteStatus('invalid');
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [token, encryptedEmail]);

  return (
    <div className="relative flex min-h-dvh w-dvw items-center justify-center bg-ui-bg-subtle p-4">
      <div className="flex w-full max-w-[360px] flex-col items-center">
        <AvatarBox checked={success} />
        <div className="max-h-[557px] w-full will-change-contents">
          {inviteStatus === 'valid' && inviteEmail ? (
            <AnimatePresence>
              {!success ? (
                <motion.div
                  key="create-account"
                  initial={false}
                  animate={{
                    height: '557px',
                    y: 0
                  }}
                  exit={{
                    height: 0,
                    y: 40
                  }}
                  transition={{
                    duration: 0.8,
                    delay: 0.6,
                    ease: [0, 0.71, 0.2, 1.01]
                  }}
                  className="w-full will-change-transform"
                >
                  <motion.div
                    initial={false}
                    animate={{
                      opacity: 1,
                      scale: 1
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.7
                    }}
                    transition={{
                      duration: 0.6,
                      delay: 0,
                      ease: [0, 0.71, 0.2, 1.01]
                    }}
                    key="inner-create-account"
                  >
                    <CreateView
                      onSuccess={() => setSuccess(true)}
                      token={token!}
                      inviteEmail={inviteEmail}
                    />
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key="success-view"
                  initial={{
                    opacity: 0,
                    scale: 0.4
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1
                  }}
                  transition={{
                    duration: 1,
                    delay: 0.6,
                    ease: [0, 0.71, 0.2, 1.01]
                  }}
                  className="w-full"
                >
                  <SuccessView />
                </motion.div>
              )}
            </AnimatePresence>
          ) : inviteStatus === 'loading' ? (
            <div className="flex flex-col items-center">
              <div className="flex flex-col items-center gap-y-1">
                <Heading>Validating invitation</Heading>
                <Text
                  size="small"
                  className="text-center text-ui-fg-subtle"
                >
                  Please wait…
                </Text>
              </div>
            </div>
          ) : (
            <InvalidView />
          )}
        </div>
      </div>
    </div>
  );
};

const LoginLink = () => {
  const { t } = useTranslation();

  return (
    <div className="flex w-full flex-col items-center">
      <div className="my-6 h-px w-full border-b border-dotted" />
      <Link
        key="login-link"
        to="/login"
        className="hover:text-ui-fg-base-hover focus-visible:text-ui-fg-base-hover txt-small font-medium text-ui-fg-base outline-none transition-fg"
      >
        {t('invite.backToLogin')}
      </Link>
    </div>
  );
};

const InvalidView = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-col items-center gap-y-1">
        <Heading>{t('invite.invalidTokenTitle')}</Heading>
        <Text
          size="small"
          className="text-center text-ui-fg-subtle"
        >
          {t('invite.invalidTokenHint')}
        </Text>
      </div>
      <LoginLink />
    </div>
  );
};

const CreateView = ({
  onSuccess,
  token,
  inviteEmail
}: {
  onSuccess: () => void;
  token: string;
  inviteEmail: string;
}) => {
  const { t } = useTranslation();
  const [invalid, setInvalid] = useState(false);

  const form = useForm<z.infer<typeof CreateAccountSchema>>({
    resolver: zodResolver(CreateAccountSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      password: '',
      repeat_password: ''
    }
  });

  const { mutateAsync: signUpEmailPass, isPending: isCreatingAuthUser } = useSignUpForInvite();

  const { mutateAsync: acceptInvite, isPending: isAcceptingInvite } = useAcceptInvite(token);

  const handleSubmit = form.handleSubmit(async data => {
    try {
      const authToken = await signUpEmailPass({
        email: inviteEmail,
        password: data.password
      });

      const invitePayload = {
        name: `${data.first_name} ${data.last_name}`
      };

      await acceptInvite({
        ...invitePayload,
        auth_token: authToken
      });

      toast.success(t('invite.toast.accepted'));

      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
      if (isFetchError(error) && error.status === 400) {
        form.setError('root', {
          type: 'manual',
          message: t('invite.invalidInvite')
        });
        setInvalid(true);
        return;
      }
    }
  });

  const serverError = form.formState.errors.root?.message;
  const validationError =
    form.formState.errors.password?.message ||
    form.formState.errors.repeat_password?.message ||
    form.formState.errors.first_name?.message ||
    form.formState.errors.last_name?.message;

  return (
    <div className="flex w-full flex-col items-center">
      <div className="mb-4 flex flex-col items-center">
        <Heading>{t('invite.title')}</Heading>
        <Text
          size="small"
          className="text-center text-ui-fg-subtle"
        >
          {t('invite.hint')}
        </Text>
      </div>
      <Form {...form}>
        <form
          onSubmit={handleSubmit}
          className="flex w-full flex-col gap-y-6"
        >
          <div className="flex flex-col gap-y-2">
            <div className="rounded-lg border border-ui-border-base bg-ui-bg-base px-4 py-3 text-center">
              <Text
                size="small"
                className="text-ui-fg-subtle"
              >
                Signing up with
              </Text>
              <Text className="break-all font-medium text-ui-fg-base">{inviteEmail}</Text>
              <Text
                size="small"
                className="mt-1 text-ui-fg-subtle"
              >
                This email is tied to your invitation and can’t be changed.
              </Text>
            </div>
            <Form.Field
              control={form.control}
              name="first_name"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Control>
                      <Input
                        autoComplete="given-name"
                        {...field}
                        className="bg-ui-bg-field-component"
                        placeholder={t('fields.firstName')}
                      />
                    </Form.Control>
                  </Form.Item>
                );
              }}
            />
            <Form.Field
              control={form.control}
              name="last_name"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Control>
                      <Input
                        autoComplete="family-name"
                        {...field}
                        className="bg-ui-bg-field-component"
                        placeholder={t('fields.lastName')}
                      />
                    </Form.Control>
                  </Form.Item>
                );
              }}
            />
            <Form.Field
              control={form.control}
              name="password"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Control>
                      <Input
                        autoComplete="new-password"
                        type="password"
                        {...field}
                        className="bg-ui-bg-field-component"
                        placeholder={t('fields.password')}
                      />
                    </Form.Control>
                  </Form.Item>
                );
              }}
            />
            <Form.Field
              control={form.control}
              name="repeat_password"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Control>
                      <Input
                        autoComplete="off"
                        type="password"
                        {...field}
                        className="bg-ui-bg-field-component"
                        placeholder={t('fields.repeatPassword')}
                      />
                    </Form.Control>
                  </Form.Item>
                );
              }}
            />
            {validationError && (
              <div className="mt-6 text-center">
                <Hint
                  className="inline-flex"
                  variant={'error'}
                >
                  {validationError}
                </Hint>
              </div>
            )}
            {serverError && (
              <Alert
                className="items-center bg-ui-bg-base p-2"
                dismissible
                variant="error"
              >
                {serverError}
              </Alert>
            )}
          </div>
          <Button
            className="w-full"
            type="submit"
            isLoading={isCreatingAuthUser || isAcceptingInvite}
            disabled={invalid}
          >
            {t('invite.createAccount')}
          </Button>
        </form>
      </Form>
      <LoginLink />
    </div>
  );
};

const SuccessView = () => {
  const { t } = useTranslation();

  return (
    <div className="flex w-full flex-col items-center gap-y-6">
      <div className="flex flex-col items-center gap-y-1">
        <Heading className="text-center">{t('invite.successTitle')}</Heading>
        <Text
          size="small"
          className="text-center text-ui-fg-subtle"
        >
          {t('invite.successHint')}
        </Text>
      </div>
      <Button
        variant="secondary"
        asChild
        className="w-full"
      >
        <Link
          to="/login"
          replace
        >
          {t('invite.successAction')}
        </Link>
      </Button>

      <Link
        key="login-link"
        to="/login"
        className="hover:text-ui-fg-base-hover focus-visible:text-ui-fg-base-hover txt-small font-medium text-ui-fg-base outline-none transition-fg"
      >
        {t('invite.backToLogin')}
      </Link>
    </div>
  );
};

// Invite token validation is handled server-side in /auth/invites/preview.
